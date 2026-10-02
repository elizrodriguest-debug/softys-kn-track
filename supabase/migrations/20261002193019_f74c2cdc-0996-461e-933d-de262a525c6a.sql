-- Enums
CREATE TYPE public.app_role AS ENUM ('ADMINISTRADOR', 'OPERACIONAL', 'VISUALIZADOR');
CREATE TYPE public.user_status AS ENUM ('ATIVO', 'INATIVO', 'PENDENTE');
CREATE TYPE public.record_status AS ENUM ('PENDENTE', 'VALIDADO', 'CANCELADO');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  status public.user_status NOT NULL DEFAULT 'ATIVO',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'ATIVO')
$$;

CREATE OR REPLACE FUNCTION public.can_write(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_active_user(_user_id) AND (
    public.has_role(_user_id, 'ADMINISTRADOR') OR public.has_role(_user_id, 'OPERACIONAL'))
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_active_user(_user_id) AND public.has_role(_user_id, 'ADMINISTRADOR')
$$;

CREATE POLICY "Ativos veem perfis" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_active_user(auth.uid()));
CREATE POLICY "Admin atualiza perfis" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Ver próprio papel ou admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Cargas / descargas
CREATE TABLE public.discharge_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_request_id uuid UNIQUE,
  division text NOT NULL CHECK (division IN ('INTERNO','EXTERNO')),
  date date NOT NULL,
  time text NOT NULL,
  shift_id text NOT NULL CHECK (shift_id IN ('T1','T2','T3')),
  dock_number text,
  carrier_name text,
  license_plate text,
  driver_name text,
  notes text,
  total_volumes integer,
  factory_type text,
  asn_number text,
  missing_asn boolean NOT NULL DEFAULT false,
  missing_asn_quantity integer NOT NULL DEFAULT 0,
  asn_divergence_details text,
  broken_pallets_count integer NOT NULL DEFAULT 0,
  fallen_pallets_count integer NOT NULL DEFAULT 0,
  invalid_ilpn_count integer NOT NULL DEFAULT 0,
  missing_ilpn_shipment_count integer NOT NULL DEFAULT 0,
  operation_type text,
  invoice_number text,
  invoice_quantity integer NOT NULL DEFAULT 0,
  vehicle_quantity integer NOT NULL DEFAULT 0,
  has_quantity_divergence boolean NOT NULL DEFAULT false,
  divergent_quantity_amount integer NOT NULL DEFAULT 0,
  missing_standard_label boolean NOT NULL DEFAULT false,
  damaged_products_count integer NOT NULL DEFAULT 0,
  entry_divergence_details text,
  status public.record_status NOT NULL DEFAULT 'PENDENTE',
  validated_by uuid,
  validated_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_by_name text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  updated_by_name text
);
CREATE UNIQUE INDEX discharge_unique_asn ON public.discharge_records (upper(trim(asn_number)))
  WHERE division = 'INTERNO' AND asn_number IS NOT NULL AND trim(asn_number) <> '' AND status <> 'CANCELADO';
CREATE INDEX discharge_date_idx ON public.discharge_records (date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discharge_records TO authenticated;
GRANT ALL ON public.discharge_records TO service_role;
ALTER TABLE public.discharge_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ativos consultam cargas" ON public.discharge_records FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));
CREATE POLICY "Operacional/Admin lançam" ON public.discharge_records FOR INSERT TO authenticated
  WITH CHECK (public.can_write(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Operacional/Admin editam" ON public.discharge_records FOR UPDATE TO authenticated
  USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY "Admin exclui" ON public.discharge_records FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Trigger: auditoria de campos, proteção de status/criador e controle de versão
CREATE OR REPLACE FUNCTION public.discharge_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uname text;
BEGIN
  SELECT full_name INTO uname FROM public.profiles WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
    NEW.created_by_name := COALESCE(uname, NEW.created_by_name);
    NEW.created_at := now();
    NEW.updated_at := now();
    NEW.updated_by := NEW.created_by;
    NEW.updated_by_name := NEW.created_by_name;
    NEW.version := 1;
    IF NEW.status <> 'PENDENTE' AND NOT public.is_admin(auth.uid()) THEN
      NEW.status := 'PENDENTE';
    END IF;
    RETURN NEW;
  END IF;
  -- UPDATE
  IF NEW.version <> OLD.version THEN
    RAISE EXCEPTION 'CONFLITO: este registro foi alterado por outro usuário. Recarregue e tente novamente.' USING ERRCODE = '40001';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Somente administradores podem validar ou cancelar lançamentos.' USING ERRCODE = '42501';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'VALIDADO' THEN
    NEW.validated_by := auth.uid();
    NEW.validated_at := now();
  END IF;
  NEW.created_by := OLD.created_by;
  NEW.created_by_name := OLD.created_by_name;
  NEW.created_at := OLD.created_at;
  NEW.version := OLD.version + 1;
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  NEW.updated_by_name := uname;
  RETURN NEW;
END $$;
CREATE TRIGGER discharge_before_write BEFORE INSERT OR UPDATE ON public.discharge_records
  FOR EACH ROW EXECUTE FUNCTION public.discharge_before_write();

-- Diário de bordo
CREATE TABLE public.logbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  shift_id text NOT NULL CHECK (shift_id IN ('T1','T2','T3')),
  notes text NOT NULL DEFAULT '',
  author_id uuid DEFAULT auth.uid(),
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, shift_id)
);
GRANT SELECT, INSERT, UPDATE ON public.logbook_entries TO authenticated;
GRANT ALL ON public.logbook_entries TO service_role;
ALTER TABLE public.logbook_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ativos veem diário" ON public.logbook_entries FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));
CREATE POLICY "Operacional/Admin escrevem diário" ON public.logbook_entries FOR INSERT TO authenticated
  WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY "Operacional/Admin editam diário" ON public.logbook_entries FOR UPDATE TO authenticated
  USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

CREATE OR REPLACE FUNCTION public.logbook_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.author_id := auth.uid();
  SELECT full_name INTO NEW.author_name FROM public.profiles WHERE id = auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER logbook_before_write BEFORE INSERT OR UPDATE ON public.logbook_entries
  FOR EACH ROW EXECUTE FUNCTION public.logbook_before_write();

-- Configurações (linha única)
CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  goal_interno integer NOT NULL DEFAULT 25,
  goal_externo integer NOT NULL DEFAULT 5,
  email_to text NOT NULL DEFAULT 'operacao.caieiras@softys.com',
  email_cc text NOT NULL DEFAULT 'supervisao.inbound@kuehne-nagel.com',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.app_settings (id) VALUES (1);
GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ativos veem configurações" ON public.app_settings FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));
CREATE POLICY "Admin altera configurações" ON public.app_settings FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Auditoria
CREATE TABLE public.audit_log (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL,
  changed_by uuid,
  changed_by_name text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin vê auditoria" ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uname text; rid text;
BEGIN
  SELECT full_name INTO uname FROM public.profiles WHERE id = auth.uid();
  IF TG_OP = 'DELETE' THEN rid := (to_jsonb(OLD)->>'id'); ELSE rid := COALESCE(to_jsonb(NEW)->>'id', to_jsonb(NEW)->>'user_id'); END IF;
  INSERT INTO public.audit_log (table_name, record_id, action, changed_by, changed_by_name, old_data, new_data)
  VALUES (TG_TABLE_NAME, rid, TG_OP, auth.uid(), uname,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER audit_discharge AFTER INSERT OR UPDATE OR DELETE ON public.discharge_records FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_logbook AFTER INSERT OR UPDATE ON public.logbook_entries FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_settings AFTER UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Realtime
ALTER TABLE public.discharge_records REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discharge_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.logbook_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
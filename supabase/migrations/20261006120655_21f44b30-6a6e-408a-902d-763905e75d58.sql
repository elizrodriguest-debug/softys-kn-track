ALTER TABLE public.app_settings
  ADD COLUMN planned_interno integer NOT NULL DEFAULT 4,
  ADD COLUMN planned_externo integer NOT NULL DEFAULT 10;

CREATE TABLE public.resource_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  shift_id text NOT NULL,
  hour text NOT NULL,
  division text NOT NULL,
  planned integer NOT NULL DEFAULT 0,
  actual integer,
  volume integer NOT NULL DEFAULT 0,
  productivity numeric,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid,
  updated_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resource_hours_unique UNIQUE (date, shift_id, hour, division)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resource_hours TO authenticated;
GRANT ALL ON public.resource_hours TO service_role;
ALTER TABLE public.resource_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ativos veem recursos" ON public.resource_hours FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "Operacional/Admin lançam recursos" ON public.resource_hours FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY "Operacional/Admin editam recursos" ON public.resource_hours FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY "Admin exclui recursos" ON public.resource_hours FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.resource_hours_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uname text;
BEGIN
  SELECT full_name INTO uname FROM public.profiles WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    SELECT CASE WHEN NEW.division = 'INTERNO' THEN planned_interno ELSE planned_externo END
      INTO NEW.planned FROM public.app_settings WHERE id = 1;
    NEW.created_by := auth.uid();
    NEW.created_at := now();
  ELSE
    NEW.planned := OLD.planned;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.productivity := CASE WHEN COALESCE(NEW.actual,0) > 0 THEN round(NEW.volume::numeric / NEW.actual, 2) END;
  NEW.updated_by := auth.uid();
  NEW.updated_by_name := uname;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER resource_hours_before_write BEFORE INSERT OR UPDATE ON public.resource_hours
FOR EACH ROW EXECUTE FUNCTION public.resource_hours_before_write();
CREATE TRIGGER audit_resource_hours AFTER INSERT OR UPDATE OR DELETE ON public.resource_hours
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_hours;
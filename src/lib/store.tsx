import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_GOALS, type DischargeRecord, type DivisionType, type LogbookEntry, type RecordStatus, type ShiftId } from "./types";
import type { AppRole } from "./auth-utils";

/** Banco central (Lovable Cloud) é a fonte oficial dos dados.
 *  Apenas a preferência visual de turno fica no navegador. */
const K_SHIFT = "inbound-kn-softys:ui-shift";

export interface Settings {
  goals: Record<DivisionType, number>;
  emailTo: string;
  emailCc: string;
  /** Recursos planejados por hora (configuráveis pelo Administrador). */
  planned: Record<DivisionType, number>;
}

export interface Session {
  operatorName: string;
  shiftId: ShiftId;
}

export interface Profile {
  id: string;
  fullName: string;
  username: string;
  status: string;
  role: AppRole;
}

const DEFAULT_SETTINGS: Settings = {
  goals: { ...DEFAULT_GOALS },
  emailTo: "",
  emailCc: "",
  planned: { INTERNO: 4, EXTERNO: 10 },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function fromRow(r: Row): DischargeRecord {
  return {
    id: r.id,
    division: r.division,
    date: r.date,
    time: r.time,
    shiftId: r.shift_id,
    dockNumber: r.dock_number ?? undefined,
    carrierName: r.carrier_name ?? undefined,
    licensePlate: r.license_plate ?? undefined,
    driverName: r.driver_name ?? undefined,
    notes: r.notes ?? undefined,
    totalVolumes: r.total_volumes ?? undefined,
    factoryType: r.factory_type ?? undefined,
    asnNumber: r.asn_number ?? undefined,
    missingAsn: r.missing_asn,
    missingAsnQuantity: r.missing_asn_quantity,
    asnDivergenceDetails: r.asn_divergence_details ?? undefined,
    brokenPalletsCount: r.broken_pallets_count,
    fallenPalletsCount: r.fallen_pallets_count,
    invalidILPNCount: r.invalid_ilpn_count,
    missingILPNShipmentCount: r.missing_ilpn_shipment_count,
    operationType: r.operation_type ?? undefined,
    invoiceNumber: r.invoice_number ?? undefined,
    invoiceQuantity: r.invoice_quantity,
    vehicleQuantity: r.vehicle_quantity,
    hasQuantityDivergence: r.has_quantity_divergence,
    divergentQuantityAmount: r.divergent_quantity_amount,
    missingStandardLabel: r.missing_standard_label,
    damagedProductsCount: r.damaged_products_count,
    entryDivergenceDetails: r.entry_divergence_details ?? undefined,
    createdAt: r.created_at,
    createdBy: r.created_by_name ?? undefined,
    createdById: r.created_by,
    status: r.status,
    version: r.version,
    updatedAt: r.updated_at,
    updatedByName: r.updated_by_name ?? undefined,
  };
}

function toRow(r: Partial<DischargeRecord>): Row {
  const m: Record<string, string> = {
    division: "division", date: "date", time: "time", shiftId: "shift_id",
    dockNumber: "dock_number", carrierName: "carrier_name", licensePlate: "license_plate",
    driverName: "driver_name", notes: "notes", totalVolumes: "total_volumes",
    factoryType: "factory_type", asnNumber: "asn_number", missingAsn: "missing_asn",
    missingAsnQuantity: "missing_asn_quantity", asnDivergenceDetails: "asn_divergence_details",
    brokenPalletsCount: "broken_pallets_count", fallenPalletsCount: "fallen_pallets_count",
    invalidILPNCount: "invalid_ilpn_count", missingILPNShipmentCount: "missing_ilpn_shipment_count",
    operationType: "operation_type", invoiceNumber: "invoice_number",
    invoiceQuantity: "invoice_quantity", vehicleQuantity: "vehicle_quantity",
    hasQuantityDivergence: "has_quantity_divergence",
    divergentQuantityAmount: "divergent_quantity_amount",
    missingStandardLabel: "missing_standard_label", damagedProductsCount: "damaged_products_count",
    entryDivergenceDetails: "entry_divergence_details", status: "status", version: "version",
  };
  const out: Row = {};
  for (const [k, col] of Object.entries(m)) {
    const v = (r as Row)[k];
    if (v !== undefined) out[col] = v;
  }
  return out;
}

function lbFromRow(r: Row): LogbookEntry {
  return {
    id: `${r.date}|${r.shift_id}`,
    date: r.date,
    shiftId: r.shift_id,
    notes: r.notes,
    updatedAt: r.updated_at,
    authorName: r.author_name ?? "",
  };
}

export function friendlyDbError(msg?: string): string {
  if (!msg) return "Erro ao comunicar com o banco de dados.";
  if (msg.includes("discharge_unique_asn")) return "ASN duplicado: este número já foi lançado.";
  if (msg.includes("client_request_id")) return "Este lançamento já foi enviado.";
  if (msg.includes("row-level security") || msg.includes("permission"))
    return "Você não tem permissão para esta operação.";
  if (msg.includes("Failed to fetch")) return "Sem conexão com o banco. Nada foi salvo.";
  return msg;
}

interface StoreCtx {
  ready: boolean;
  authReady: boolean;
  user: User | null;
  profile: Profile | null;
  can: { write: boolean; admin: boolean };
  /** Registros ativos (exclui cancelados) — base de KPIs e gráficos. */
  records: DischargeRecord[];
  /** Todos os registros, incluindo cancelados — para o Histórico. */
  allRecords: DischargeRecord[];
  logbook: LogbookEntry[];
  settings: Settings;
  session: Session;
  saveRecord: (
    r: Omit<DischargeRecord, "id" | "createdAt"> & { id?: string; clientRequestId?: string },
  ) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  setRecordStatus: (id: string, status: RecordStatus) => Promise<void>;
  saveLogbook: (date: string, shiftId: ShiftId, notes: string) => void;
  getLogbook: (date: string, shiftId: ShiftId) => LogbookEntry | undefined;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  updateSession: (patch: Partial<Session>) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allRecords, setAll] = useState<DischargeRecord[]>([]);
  const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [shiftId, setShiftId] = useState<ShiftId>("T1");
  const lbTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem(K_SHIFT);
      if (s === "T1" || s === "T2" || s === "T3") setShiftId(s);
    } catch { /* ignore */ }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setUser(sess?.user ?? null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    const recs: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("discharge_records")
        .select("*")
        .order("date", { ascending: false })
        .range(from, from + 999);
      if (error) break;
      recs.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    setAll(recs.map(fromRow));
    const { data: lb } = await supabase.from("logbook_entries").select("*").order("date", { ascending: false });
    setLogbook((lb ?? []).map(lbFromRow));
    const { data: st } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
    if (st)
      setSettings({
        goals: { INTERNO: st.goal_interno, EXTERNO: st.goal_externo },
        emailTo: st.email_to,
        emailCc: st.email_cc,
        planned: { INTERNO: (st as Row).planned_interno ?? 4, EXTERNO: (st as Row).planned_externo ?? 10 },
      });
  }, []);

  // Carrega perfil + dados quando há usuário; assina Realtime.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setAll([]);
      setLogbook([]);
      setReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      if (!p || p.status !== "ATIVO") {
        await supabase.auth.signOut();
        return;
      }
      const roles = (r ?? []).map((x) => x.role as AppRole);
      const role: AppRole = roles.includes("ADMINISTRADOR")
        ? "ADMINISTRADOR"
        : roles.includes("OPERACIONAL")
          ? "OPERACIONAL"
          : "VISUALIZADOR";
      setProfile({ id: p.id, fullName: p.full_name, username: p.username, status: p.status, role });
      await loadAll();
      if (!cancelled) setReady(true);
    })();

    const channel = supabase
      .channel("inbound-shared")
      .on("postgres_changes", { event: "*", schema: "public", table: "discharge_records" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as Row).id;
          setAll((prev) => prev.filter((x) => x.id !== id));
        } else {
          const rec = fromRow(payload.new as Row);
          setAll((prev) => {
            const i = prev.findIndex((x) => x.id === rec.id);
            if (i === -1) return [rec, ...prev];
            const next = prev.slice();
            next[i] = rec;
            return next;
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "logbook_entries" }, (payload) => {
        if (payload.eventType === "DELETE") return;
        const e = lbFromRow(payload.new as Row);
        setLogbook((prev) => [e, ...prev.filter((l) => l.id !== e.id)]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings" }, (payload) => {
        const st = payload.new as Row;
        setSettings({
          goals: { INTERNO: st.goal_interno, EXTERNO: st.goal_externo },
          emailTo: st.email_to,
          emailCc: st.email_cc,
          planned: { INTERNO: st.planned_interno ?? 4, EXTERNO: st.planned_externo ?? 10 },
        });
      })
      .subscribe();

    // Rede de segurança: recarrega ao voltar o foco da janela.
    const onFocus = () => void loadAll();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [user, loadAll]);

  const upsertLocal = (rec: DischargeRecord) =>
    setAll((prev) => {
      const i = prev.findIndex((x) => x.id === rec.id);
      if (i === -1) return [rec, ...prev];
      const next = prev.slice();
      next[i] = rec;
      return next;
    });

  const value = useMemo<StoreCtx>(() => {
    const role = profile?.role;
    return {
      ready,
      authReady,
      user,
      profile,
      can: { write: role === "ADMINISTRADOR" || role === "OPERACIONAL", admin: role === "ADMINISTRADOR" },
      records: allRecords.filter((r) => r.status !== "CANCELADO"),
      allRecords,
      logbook,
      settings,
      session: { operatorName: profile?.fullName ?? "", shiftId },
      saveRecord: async (r) => {
        const { id, clientRequestId, ...rest } = r;
        if (id) {
          const current = allRecords.find((x) => x.id === id);
          const { data, error } = await supabase
            .from("discharge_records")
            .update(toRow({ ...rest, version: current?.version ?? r.version ?? 1 }))
            .eq("id", id)
            .select()
            .single();
          if (error) throw new Error(friendlyDbError(error.message));
          upsertLocal(fromRow(data));
        } else {
          const row = toRow(rest);
          delete row.status;
          delete row.version;
          const { data, error } = await supabase
            .from("discharge_records")
            .insert({ ...row, client_request_id: clientRequestId, created_by: user?.id } as any)
            .select()
            .single();
          if (error) throw new Error(friendlyDbError(error.message));
          upsertLocal(fromRow(data));
        }
      },
      deleteRecord: async (id) => {
        const { error, count } = await supabase
          .from("discharge_records")
          .delete({ count: "exact" })
          .eq("id", id);
        if (error) throw new Error(friendlyDbError(error.message));
        if (!count) throw new Error("Você não tem permissão para excluir registros.");
        setAll((prev) => prev.filter((x) => x.id !== id));
      },
      setRecordStatus: async (id, status) => {
        const current = allRecords.find((x) => x.id === id);
        const { data, error } = await supabase
          .from("discharge_records")
          .update({ status, version: current?.version ?? 1 })
          .eq("id", id)
          .select()
          .single();
        if (error) throw new Error(friendlyDbError(error.message));
        upsertLocal(fromRow(data));
      },
      saveLogbook: (date, sid, notes) => {
        const key = `${date}|${sid}`;
        setLogbook((prev) => {
          const entry: LogbookEntry = {
            id: key, date, shiftId: sid, notes,
            updatedAt: new Date().toISOString(),
            authorName: profile?.fullName ?? "",
          };
          return [entry, ...prev.filter((l) => l.id !== key)];
        });
        clearTimeout(lbTimers.current[key]);
        lbTimers.current[key] = setTimeout(async () => {
          const { error } = await supabase
            .from("logbook_entries")
            .upsert({ date, shift_id: sid, notes }, { onConflict: "date,shift_id" });
          if (error) {
            const { toast } = await import("sonner");
            toast.error(`Diário de Bordo não salvo: ${friendlyDbError(error.message)}`);
          }
        }, 700);
      },
      getLogbook: (date, sid) => logbook.find((l) => l.id === `${date}|${sid}`),
      updateSettings: async (patch) => {
        const next = { ...settings, ...patch };
        const { error } = await supabase
          .from("app_settings")
          .update({
            goal_interno: next.goals.INTERNO,
            goal_externo: next.goals.EXTERNO,
            email_to: next.emailTo,
            email_cc: next.emailCc,
            planned_interno: next.planned.INTERNO,
            planned_externo: next.planned.EXTERNO,
            updated_at: new Date().toISOString(),
            updated_by: user?.id ?? null,
          })
          .eq("id", 1)
          .select()
          .single();
        if (error) throw new Error(friendlyDbError(error.message));
        setSettings(next);
      },
      updateSession: (patch) => {
        if (patch.shiftId) {
          setShiftId(patch.shiftId);
          try { localStorage.setItem(K_SHIFT, patch.shiftId); } catch { /* ignore */ }
        }
      },
      refresh: loadAll,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [ready, authReady, user, profile, allRecords, logbook, settings, shiftId, loadAll]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_GOALS,
  DEFAULT_PALLETS_PER_VEHICLE,
  EXTERNAL_OPERATIONS,
  SHIFTS,
  shiftFromTime,
  type DischargeRecord,
  type DivisionType,
  type ExternalOperationType,
  type FactoryType,
  type LogbookEntry,
  type ShiftId,
} from "./types";

const K_RECORDS = "inbound-kn-softys:records:v2";
const K_LOGBOOK = "inbound-kn-softys:logbook:v2";
const K_SETTINGS = "inbound-kn-softys:settings:v2";
const K_SESSION = "inbound-kn-softys:session:v2";

export interface Settings {
  goals: Record<DivisionType, number>;
  emailTo: string;
  emailCc: string;
}

export interface Session {
  operatorName: string;
  shiftId: ShiftId;
}

const DEFAULT_SETTINGS: Settings = {
  goals: { ...DEFAULT_GOALS },
  emailTo: "operacao.caieiras@softys.com",
  emailCc: "supervisao.inbound@kuehne-nagel.com",
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const CARRIERS = [
  "Kuehne+Nagel",
  "Transportes Andorinha",
  "Rodoviário Sul",
  "TransLog Express",
  "Via Norte Cargas",
];
const PLATES = ["RTX3D45", "KLM7A21", "BRA2E19", "FGH8B03", "QWE4C77", "ZXC9D12", "JPL5F88"];
const DRIVERS = [
  "Marcos Ribeiro",
  "Juliana Prado",
  "Carlos Menezes",
  "Renata Lopes",
  "Anderson Silva",
  "Paulo Tavares",
];

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

const SHIFT_HOURS: Record<ShiftId, number[]> = {
  T1: [6, 7, 8, 9, 10, 11, 12, 13, 14],
  T2: [14, 15, 16, 17, 18, 19, 20, 21, 22],
  T3: [23, 0, 1, 2, 3, 4, 5],
};

function timeInShift(shift: ShiftId): string {
  const h = pick(SHIFT_HOURS[shift]);
  let m = rnd(0, 59);
  if (shift === "T1" && h === 14) m = rnd(0, 19);
  if (shift === "T2" && h === 14) m = rnd(20, 59);
  if (shift === "T2" && h === 22) m = rnd(0, 34);
  if (shift === "T3" && h === 23) m = rnd(0, 59);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function seedRecords(): DischargeRecord[] {
  const out: DischargeRecord[] = [];
  const today = new Date();
  for (let d = 20; d >= 0; d--) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - d);
    const date = dt.toISOString().slice(0, 10);
    for (const s of SHIFTS) {
      // Recebimento Interno (Softys)
      const internos = rnd(20, 27);
      for (let i = 0; i < internos; i++) {
        const time = timeInShift(s.id);
        const anomaly = Math.random() < 0.3;
        const factoryType: FactoryType = Math.random() < 0.55 ? "Tissue" : "Personal";
        const missingAsn = anomaly && Math.random() < 0.18;
        out.push({
          id: uid(),
          division: "INTERNO",
          date,
          time,
          shiftId: shiftFromTime(time),
          dockNumber: String(rnd(1, 12)),
          carrierName: pick(CARRIERS),
          licensePlate: pick(PLATES),
          driverName: pick(DRIVERS),
          notes: "",
          totalVolumes: Math.random() < 0.75 ? DEFAULT_PALLETS_PER_VEHICLE : rnd(14, 32),
          factoryType,
          asnNumber: missingAsn ? "" : `ASN-${rnd(100000, 999999)}`,
          missingAsn,
          missingAsnQuantity: missingAsn ? rnd(5, 28) : 0,
          asnDivergenceDetails:
            anomaly && Math.random() < 0.15 ? "Quantidade de ASN divergente do físico" : "",
          brokenPalletsCount: anomaly && Math.random() < 0.45 ? rnd(1, 3) : 0,
          fallenPalletsCount: anomaly && Math.random() < 0.3 ? rnd(1, 2) : 0,
          invalidILPNCount: anomaly && Math.random() < 0.35 ? rnd(1, 4) : 0,
          missingILPNShipmentCount: anomaly && Math.random() < 0.3 ? rnd(1, 3) : 0,
          createdAt: new Date(dt).toISOString(),
          createdBy: "Demonstração",
        });
      }
      // Recebimento Externo (Kuehne+Nagel)
      const externos = rnd(3, 6);
      for (let i = 0; i < externos; i++) {
        const time = timeInShift(s.id);
        const anomaly = Math.random() < 0.33;
        const operationType: ExternalOperationType = pick(EXTERNAL_OPERATIONS);
        const invoiceQuantity = rnd(120, 900);
        const hasQuantityDivergence = anomaly && Math.random() < 0.4;
        const diff = hasQuantityDivergence ? rnd(1, 20) : 0;
        out.push({
          id: uid(),
          division: "EXTERNO",
          date,
          time,
          shiftId: shiftFromTime(time),
          dockNumber: String(rnd(1, 12)),
          carrierName: pick(CARRIERS),
          licensePlate: pick(PLATES),
          driverName: pick(DRIVERS),
          notes: "",
          totalVolumes: rnd(80, 600),
          operationType,
          invoiceNumber: `NF-${rnd(10000, 99999)}`,
          invoiceQuantity,
          vehicleQuantity: invoiceQuantity - diff,
          hasQuantityDivergence,
          divergentQuantityAmount: diff,
          missingStandardLabel: anomaly && Math.random() < 0.35,
          damagedProductsCount: anomaly && Math.random() < 0.4 ? rnd(1, 6) : 0,
          fallenPalletsCount: anomaly && Math.random() < 0.25 ? rnd(1, 2) : 0,
          entryDivergenceDetails:
            anomaly && Math.random() < 0.2 ? "Divergência de entrada apontada na conferência" : "",
          createdAt: new Date(dt).toISOString(),
          createdBy: "Demonstração",
        });
      }
    }
  }
  return out;
}

function seedLogbook(): LogbookEntry[] {
  const today = new Date().toISOString().slice(0, 10);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  return [
    {
      id: `${today}|T1`,
      date: today,
      shiftId: "T1",
      notes: "Atraso de carretas na portaria entre 07h e 08h por fila de conferência fiscal.",
      updatedAt: new Date().toISOString(),
      authorName: "Marcos Ribeiro",
    },
    {
      id: `${yesterday}|T2`,
      date: yesterday,
      shiftId: "T2",
      notes: "Queda de sistema WMS por 35 minutos; docas 4 e 5 indisponíveis para manutenção.",
      updatedAt: new Date().toISOString(),
      authorName: "Juliana Prado",
    },
  ];
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

interface StoreCtx {
  ready: boolean;
  records: DischargeRecord[];
  logbook: LogbookEntry[];
  settings: Settings;
  session: Session;
  saveRecord: (r: Omit<DischargeRecord, "id" | "createdAt"> & { id?: string }) => void;
  deleteRecord: (id: string) => void;
  saveLogbook: (date: string, shiftId: ShiftId, notes: string) => void;
  getLogbook: (date: string, shiftId: ShiftId) => LogbookEntry | undefined;
  updateSettings: (patch: Partial<Settings>) => void;
  updateSession: (patch: Partial<Session>) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

const DEFAULT_SESSION: Session = { operatorName: "Marcos Ribeiro", shiftId: "T1" };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [records, setRecords] = useState<DischargeRecord[]>([]);
  const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<Session>(DEFAULT_SESSION);

  useEffect(() => {
    let recs = read<DischargeRecord[] | null>(K_RECORDS, null);
    if (!recs || recs.length === 0) {
      recs = seedRecords();
      write(K_RECORDS, recs);
    }
    let lb = read<LogbookEntry[] | null>(K_LOGBOOK, null);
    if (!lb) {
      lb = seedLogbook();
      write(K_LOGBOOK, lb);
    }
    setRecords(recs);
    setLogbook(lb);
    setSettings({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(K_SETTINGS, {}) });
    setSession({ ...DEFAULT_SESSION, ...read<Partial<Session>>(K_SESSION, {}) });
    setReady(true);
  }, []);

  const persistRecords = useCallback((next: DischargeRecord[]) => {
    setRecords(next);
    write(K_RECORDS, next);
  }, []);

  const value = useMemo<StoreCtx>(
    () => ({
      ready,
      records,
      logbook,
      settings,
      session,
      saveRecord: (r) => {
        if (r.id) {
          persistRecords(
            records.map((x) => (x.id === r.id ? ({ ...x, ...r, id: r.id } as DischargeRecord) : x)),
          );
        } else {
          const novo: DischargeRecord = {
            ...r,
            id: uid(),
            createdAt: new Date().toISOString(),
            createdBy: r.createdBy ?? session.operatorName,
          };
          persistRecords([novo, ...records]);
        }
      },
      deleteRecord: (id) => persistRecords(records.filter((x) => x.id !== id)),
      saveLogbook: (date, shiftId, notes) => {
        const id = `${date}|${shiftId}`;
        const entry: LogbookEntry = {
          id,
          date,
          shiftId,
          notes,
          updatedAt: new Date().toISOString(),
          authorName: session.operatorName,
        };
        const next = logbook.some((l) => l.id === id)
          ? logbook.map((l) => (l.id === id ? entry : l))
          : [entry, ...logbook];
        setLogbook(next);
        write(K_LOGBOOK, next);
      },
      getLogbook: (date, shiftId) => logbook.find((l) => l.id === `${date}|${shiftId}`),
      updateSettings: (patch) => {
        const next = { ...settings, ...patch };
        setSettings(next);
        write(K_SETTINGS, next);
      },
      updateSession: (patch) => {
        const next = { ...session, ...patch };
        setSession(next);
        write(K_SESSION, next);
      },
    }),
    [ready, records, logbook, settings, session, persistRecords],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}

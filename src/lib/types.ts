export type DivisionType = "INTERNO" | "EXTERNO";

export type ShiftId = "T1" | "T2" | "T3";

export type FactoryType = "Tissue" | "Personal";

export type ExternalOperationType =
  | "Importação"
  | "Transferências Filiais"
  | "Devolução"
  | "Retrabalho";

export interface DischargeRecord {
  id: string;
  division: DivisionType;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:mm
  shiftId: ShiftId;
  dockNumber?: string;
  carrierName?: string;
  licensePlate?: string;
  driverName?: string;
  notes?: string;
  totalVolumes?: number;

  // Campos específicos Softys (Interno)
  factoryType?: FactoryType;
  asnNumber?: string;
  missingAsn?: boolean;
  missingAsnQuantity?: number;
  asnDivergenceDetails?: string;
  brokenPalletsCount?: number;
  fallenPalletsCount?: number;
  invalidILPNCount?: number;
  missingILPNShipmentCount?: number;

  // Campos específicos K+N (Externo)
  operationType?: ExternalOperationType;
  invoiceNumber?: string;
  invoiceQuantity?: number;
  vehicleQuantity?: number;
  hasQuantityDivergence?: boolean;
  divergentQuantityAmount?: number;
  missingStandardLabel?: boolean;
  damagedProductsCount?: number;
  entryDivergenceDetails?: string;

  createdAt: string;
  createdBy?: string;
  createdById?: string;
  status?: RecordStatus;
  version?: number;
  updatedAt?: string;
  updatedByName?: string;
}

export type RecordStatus = "PENDENTE" | "VALIDADO" | "CANCELADO";

export interface LogbookEntry {
  id: string;
  date: string;
  shiftId: ShiftId;
  notes: string;
  updatedAt: string;
  authorName: string;
}

/* ---------- Constantes operacionais ---------- */

export const SHIFTS: { id: ShiftId; label: string; range: string; start: string; end: string }[] = [
  { id: "T1", label: "Turno 1", range: "06:00 às 14:20", start: "06:00", end: "14:20" },
  { id: "T2", label: "Turno 2", range: "14:20 às 22:35", start: "14:20", end: "22:35" },
  { id: "T3", label: "Turno 3", range: "22:35 às 06:00", start: "22:35", end: "06:00" },
];

export const FACTORIES: FactoryType[] = ["Tissue", "Personal"];

export const EXTERNAL_OPERATIONS: ExternalOperationType[] = [
  "Importação",
  "Transferências Filiais",
  "Devolução",
  "Retrabalho",
];

/** Metas padrão por turno (25 internos = 75/dia; 5 externos = 15/dia). */
export const DEFAULT_GOALS: Record<DivisionType, number> = { INTERNO: 25, EXTERNO: 5 };

/** Volumes padrão por descarga interna. */
export const DEFAULT_PALLETS_PER_VEHICLE = 28;

export const DIVISION_LABEL: Record<DivisionType, string> = {
  INTERNO: "Recebimento Interno",
  EXTERNO: "Recebimento Externo",
};

export const DIVISION_OWNER: Record<DivisionType, string> = {
  INTERNO: "Softys",
  EXTERNO: "Kuehne+Nagel",
};

export const FACTORY_COLORS: Record<FactoryType, string> = {
  Tissue: "var(--color-success)",
  Personal: "var(--color-brand)",
};

/** Identifica o turno a partir do horário HH:mm informado. */
export function shiftFromTime(time: string): ShiftId {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const mins = (h ?? 0) * 60 + (m ?? 0);
  if (mins >= 6 * 60 && mins < 14 * 60 + 20) return "T1";
  if (mins >= 14 * 60 + 20 && mins < 22 * 60 + 35) return "T2";
  return "T3";
}

export interface NonConformity {
  label: string;
  quantity: number;
  detail?: string;
}

/** Lista as não-conformidades de um registro, respeitando as regras de cada divisão. */
export function nonConformities(r: DischargeRecord): NonConformity[] {
  const out: NonConformity[] = [];
  if (r.division === "INTERNO") {
    if (r.brokenPalletsCount) out.push({ label: "Pallets Quebrados", quantity: r.brokenPalletsCount });
    if (r.fallenPalletsCount) out.push({ label: "Pallets Tombados", quantity: r.fallenPalletsCount });
    if (r.missingAsn)
      out.push({
        label: "Carga sem ASN",
        quantity: r.missingAsnQuantity ?? 0,
        detail: `${r.missingAsnQuantity ?? 0} volumes sem ASN`,
      });
    if (r.invalidILPNCount) out.push({ label: "iLPN Inválida", quantity: r.invalidILPNCount });
    if (r.missingILPNShipmentCount)
      out.push({ label: "iLPN Ausente", quantity: r.missingILPNShipmentCount });
    if (r.asnDivergenceDetails?.trim())
      out.push({ label: "Divergência de ASN", quantity: 1, detail: r.asnDivergenceDetails });
  } else {
    if (r.hasQuantityDivergence)
      out.push({
        label: "Divergência de Quantidade",
        quantity: r.divergentQuantityAmount ?? 0,
        detail: `NF ${r.invoiceQuantity ?? 0} x Físico ${r.vehicleQuantity ?? 0}`,
      });
    if (r.missingStandardLabel) out.push({ label: "Falta de Etiqueta Padrão", quantity: 1 });
    if (r.damagedProductsCount)
      out.push({ label: "Produtos Avariados", quantity: r.damagedProductsCount });
    if (r.fallenPalletsCount) out.push({ label: "Pallets Tombados", quantity: r.fallenPalletsCount });
    if (r.entryDivergenceDetails?.trim())
      out.push({ label: "Divergências de Entrada", quantity: 1, detail: r.entryDivergenceDetails });
  }
  return out;
}

export function isConforme(r: DischargeRecord): boolean {
  return nonConformities(r).length === 0;
}

export function recordVolumes(r: DischargeRecord): number {
  return r.totalVolumes ?? (r.division === "INTERNO" ? DEFAULT_PALLETS_PER_VEHICLE : 0);
}

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

import {
  EXTERNAL_OPERATIONS,
  FACTORIES,
  SHIFTS,
  isConforme,
  nonConformities,
  recordVolumes,
  type DischargeRecord,
  type ShiftId,
} from "./types";

export interface Kpis {
  vehicles: number;
  volumes: number;
  conformes: number;
  nonConformes: number;
  conformityRate: number;
  goal: number;
  attainment: number;
}

export function computeKpis(records: DischargeRecord[], goal: number): Kpis {
  const vehicles = records.length;
  const volumes = records.reduce((a, r) => a + recordVolumes(r), 0);
  const conformes = records.filter(isConforme).length;
  return {
    vehicles,
    volumes,
    conformes,
    nonConformes: vehicles - conformes,
    conformityRate: vehicles ? Math.round((conformes / vehicles) * 1000) / 10 : 100,
    goal,
    attainment: goal ? Math.round((vehicles / goal) * 1000) / 10 : 0,
  };
}

/** Veículos por turno separados por fábrica (interno) ou operação (externo). */
export function byShiftSeries(records: DischargeRecord[], division: "INTERNO" | "EXTERNO") {
  const keys = division === "INTERNO" ? FACTORIES : EXTERNAL_OPERATIONS;
  return SHIFTS.map((s) => {
    const rs = records.filter((r) => r.shiftId === s.id);
    const row: Record<string, string | number> = { turno: s.label };
    let total = 0;
    for (const k of keys) {
      const n = rs.filter((r) =>
        division === "INTERNO" ? r.factoryType === k : r.operationType === k,
      ).length;
      row[k] = n;
      total += n;
    }
    row.total = total;
    return row;
  });
}

/** Produtividade por faixa de horário (descargas por hora). */
export function byHourSeries(records: DischargeRecord[]) {
  const order = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5];
  const counts = new Map<number, number>(order.map((h) => [h, 0]));
  for (const r of records) {
    const h = Number(r.time.split(":")[0] ?? 0);
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  return order.map((h) => ({
    hora: `${String(h).padStart(2, "0")}h`,
    Descargas: counts.get(h) ?? 0,
  }));
}

/** Pareto de ocorrências: motivo, quantidade, % acumulado. */
export function paretoSeries(records: DischargeRecord[]) {
  const map = new Map<string, number>();
  for (const r of records) {
    for (const nc of nonConformities(r)) {
      map.set(nc.label, (map.get(nc.label) ?? 0) + Math.max(1, nc.quantity));
    }
  }
  const rows = [...map.entries()]
    .map(([motivo, qtd]) => ({ motivo, Ocorrências: qtd }))
    .sort((a, b) => b["Ocorrências"] - a["Ocorrências"]);
  const total = rows.reduce((a, r) => a + r["Ocorrências"], 0);
  let acc = 0;
  return rows.map((r) => {
    acc += r["Ocorrências"];
    return { ...r, Acumulado: total ? Math.round((acc / total) * 1000) / 10 : 0 };
  });
}

export function countByKey(
  records: DischargeRecord[],
  key: (r: DischargeRecord) => string | undefined,
) {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = key(r);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

export function sumNonConformity(records: DischargeRecord[], label: string) {
  return records.reduce(
    (a, r) => a + nonConformities(r).filter((n) => n.label === label).reduce((x, n) => x + Math.max(1, n.quantity), 0),
    0,
  );
}

export function shiftLabel(id: ShiftId) {
  return SHIFTS.find((s) => s.id === id)?.label ?? id;
}

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { recordVolumes, type DischargeRecord, type DivisionType, type ShiftId } from "./types";

export interface ResourceHour {
  id: string;
  date: string;
  shiftId: ShiftId;
  hour: string; // "HH:00"
  division: DivisionType;
  planned: number;
  actual: number | null;
  volume: number;
  notes: string;
  updatedByName?: string;
  updatedAt: string;
}

/** Horas de cada turno (T1 06:00–14:20, T2 14:20–22:35, T3 22:35–06:00). */
export const SHIFT_HOURS: Record<ShiftId, string[]> = {
  T1: ["06", "07", "08", "09", "10", "11", "12", "13", "14"],
  T2: ["14", "15", "16", "17", "18", "19", "20", "21", "22"],
  T3: ["22", "23", "00", "01", "02", "03", "04", "05"],
}; 

export const hourLabel = (h: string) => `${h}:00`;
export const rhKey = (date: string, shift: string, hour: string, div: string) =>
  `${date}|${shift}|${hour}|${div}`;

/** Volume processado por data+turno+hora+operação, a partir das descargas lançadas. */
export function volumeByHour(records: DischargeRecord[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of records) {
    const k = rhKey(r.date, r.shiftId, r.time.slice(0, 2), r.division);
    m.set(k, (m.get(k) ?? 0) + recordVolumes(r));
  }
  return m;
}

/** Produtividade = volume / recursos REAIS. Nunca usa recursos planejados. */
export function productivity(volume: number, actual: number | null | undefined): number | null {
  if (!actual || actual <= 0) return null;
  return volume / actual;
}

/** Consolidação (turno, dia ou mês): volume total / recursos-hora reais totais.
 *  Não usa média simples das produtividades. */
export function consolidate(items: { volume: number; actual: number | null; planned: number }[]) {
  const tracked = items.filter((i) => i.actual != null);
  const volume = tracked.reduce((a, i) => a + i.volume, 0);
  const resourceHours = tracked.reduce((a, i) => a + (i.actual ?? 0), 0);
  const planned = tracked.reduce((a, i) => a + i.planned, 0);
  return {
    volume,
    resourceHours,
    planned,
    hours: tracked.length,
    productivity: resourceHours > 0 ? volume / resourceHours : null,
    adherence: planned > 0 ? resourceHours / planned : null,
  };
}

export const fmtNum = (n: number | null | undefined, d = 1) =>
  n == null ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: d });
export const fmtPct = (n: number | null | undefined) =>
  n == null ? "—" : `${(n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): ResourceHour {
  return {
    id: r.id, date: r.date, shiftId: r.shift_id, hour: r.hour, division: r.division,
    planned: r.planned, actual: r.actual, volume: r.volume, notes: r.notes ?? "",
    updatedByName: r.updated_by_name ?? undefined, updatedAt: r.updated_at,
  };
}

/** Lê do banco compartilhado os recursos por hora no intervalo [from, to], com atualização em tempo real. */
export function useResourceHours(from: string, to: string) {
  const [rows, setRows] = useState<ResourceHour[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase
      .from("resource_hours" as never)
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .limit(5000);
    setRows(((data as unknown[]) ?? []).map(fromRow));
  }, [from, to]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`rh-${from}-${to}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "resource_hours" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, from, to]);

  const save = useCallback(
    async (p: { date: string; shiftId: ShiftId; hour: string; division: DivisionType; actual: number | null; volume: number; notes: string }) => {
      const { error } = await supabase
        .from("resource_hours" as never)
        .upsert(
          { date: p.date, shift_id: p.shiftId, hour: p.hour, division: p.division, actual: p.actual, volume: p.volume, notes: p.notes } as never,
          { onConflict: "date,shift_id,hour,division" },
        );
      if (error) throw new Error(error.message.includes("row-level") ? "Você não tem permissão para esta operação." : error.message);
      await load();
    },
    [load],
  );

  return { rows, save, reload: load };
}

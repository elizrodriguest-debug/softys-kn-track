import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { formatDateBR, type DivisionType, type ShiftId } from "@/lib/types";
import {
  SHIFT_HOURS, consolidate, fmtNum, fmtPct, hourLabel, productivity, rhKey, useResourceHours, volumeByHour,
} from "@/lib/resources";
import { cn } from "@/lib/utils";

const DIVS: DivisionType[] = ["INTERNO", "EXTERNO"];

export function ResourceHoursPanel({ date, shiftId }: { date: string; shiftId: ShiftId }) {
  const { records, settings, can } = useStore();
  const { rows, save } = useResourceHours(date, date);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const vol = useMemo(() => volumeByHour(records), [records]);
  const byKey = useMemo(() => new Map(rows.map((r) => [rhKey(r.date, r.shiftId, r.hour, r.division), r])), [rows]);

  const line = (hour: string, div: DivisionType) => {
    const k = rhKey(date, shiftId, hour, div);
    const row = byKey.get(k);
    const volume = vol.get(k) ?? 0;
    const planned = row?.planned ?? settings.planned[div];
    const actual = row?.actual ?? null;
    return { k, row, volume, planned, actual, prod: productivity(volume, actual) };
  };

  const persist = async (hour: string, div: DivisionType, actual: number | null, notes: string) => {
    const l = line(hour, div);
    try {
      await save({ date, shiftId, hour, division: div, actual, volume: l.volume, notes });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onActual = (hour: string, div: DivisionType, raw: string) => {
    const l = line(hour, div);
    const v = raw.trim() === "" ? null : Math.max(0, Math.floor(Number(raw) || 0));
    if (v === l.actual) return;
    const notes = line(hour, "INTERNO").row?.notes ?? "";
    persist(hour, div, v, notes);
  };

  const onNotes = async (hour: string, text: string) => {
    const cur = line(hour, "INTERNO").row?.notes ?? "";
    if (text === cur) return;
    for (const d of DIVS) await persist(hour, d, line(hour, d).actual, text);
  };

  const hours = SHIFT_HOURS[shiftId];
  const totals = Object.fromEntries(
    DIVS.map((d) => [d, consolidate(hours.map((h) => line(h, d)))]),
  ) as Record<DivisionType, ReturnType<typeof consolidate>>;

  const numCell = "px-2 py-1.5 text-right tabular-nums";

  return (
    <div className="card-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Users className="h-4 w-4 text-brand" />
        <h3 className="font-display text-base font-semibold">Recursos e Produtividade por Hora</h3>
        <span className="text-xs text-muted-foreground">{formatDateBR(date)} · {shiftId}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Planejado vem de Configurações / Metas. Informe os recursos reais de cada hora — a produtividade
        usa sempre os recursos reais (volume ÷ recursos reais).
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-xs">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-left">Hora</th>
              <th className={numCell}>Int. Plan.</th>
              <th className={numCell}>Int. Real</th>
              <th className={numCell}>Vol. Int.</th>
              <th className={numCell}>Prod. Int.</th>
              <th className={numCell}>Ext. Plan.</th>
              <th className={numCell}>Ext. Real</th>
              <th className={numCell}>Vol. Ext.</th>
              <th className={numCell}>Prod. Ext.</th>
              <th className="px-2 py-2 text-left">Observação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {hours.map((h) => (
              <tr key={h}>
                <td className="px-2 py-1.5 font-medium">{hourLabel(h)}</td>
                {DIVS.map((d) => {
                  const l = line(h, d);
                  const dk = l.k;
                  const under = l.actual != null && l.actual < l.planned;
                  return (
                    <FragmentCells key={d}>
                      <td className={cn(numCell, "text-muted-foreground")}>{l.planned}</td>
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          min={0}
                          disabled={!can.write}
                          aria-label={`Recursos reais ${d} ${hourLabel(h)}`}
                          className={cn("h-7 w-16 text-right", under && "border-warning text-warning")}
                          value={draft[dk] ?? (l.actual ?? "").toString()}
                          onChange={(e) => setDraft((p) => ({ ...p, [dk]: e.target.value }))}
                          onBlur={(e) => {
                            onActual(h, d, e.target.value);
                            setDraft((p) => { const n = { ...p }; delete n[dk]; return n; });
                          }}
                        />
                      </td>
                      <td className={numCell}>{fmtNum(l.volume, 0)}</td>
                      <td className={cn(numCell, "font-semibold")}>{fmtNum(l.prod)}</td>
                    </FragmentCells>
                  );
                })}
                <td className="px-1 py-1">
                  <Input
                    disabled={!can.write}
                    placeholder="Ex.: 1 colaborador ausente"
                    className="h-7 min-w-[200px]"
                    value={draft[`n|${h}`] ?? line(h, "INTERNO").row?.notes ?? ""}
                    onChange={(e) => setDraft((p) => ({ ...p, [`n|${h}`]: e.target.value }))}
                    onBlur={(e) => {
                      onNotes(h, e.target.value);
                      setDraft((p) => { const n = { ...p }; delete n[`n|${h}`]; return n; });
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/40 font-semibold">
            <tr>
              <td className="px-2 py-2">Turno</td>
              {DIVS.map((d) => (
                <FragmentCells key={d}>
                  <td className={numCell}>{totals[d].planned || "—"}</td>
                  <td className={numCell}>{totals[d].resourceHours || "—"}</td>
                  <td className={numCell}>{fmtNum(totals[d].volume, 0)}</td>
                  <td className={numCell}>{fmtNum(totals[d].productivity)}</td>
                </FragmentCells>
              ))}
              <td className="px-2 py-2 text-[11px] font-normal text-muted-foreground">
                Aderência: Int. {fmtPct(totals.INTERNO.adherence)} · Ext. {fmtPct(totals.EXTERNO.adherence)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Produtividade do turno = volume total ÷ recursos-hora reais (soma dos recursos de cada hora). Aderência = reais ÷ planejados.
      </p>
    </div>
  );
}

function FragmentCells({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import { useMemo } from "react";
import { Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDateBR, type DivisionType } from "@/lib/types";
import { consolidate, fmtNum, fmtPct, rhKey, useResourceHours, volumeByHour } from "@/lib/resources";

/** Indicadores mensais de recursos: produtividade = volume total do mês ÷ recursos-hora reais do mês. */
export function ResourceMonthlyPanel({ ano, mes }: { ano: string; mes: string }) {
  const { records } = useStore();
  const last = new Date(Number(ano), Number(mes), 0).getDate();
  const from = `${ano}-${mes}-01`;
  const to = `${ano}-${mes}-${String(last).padStart(2, "0")}`;
  const { rows } = useResourceHours(from, to);
  const vol = useMemo(() => volumeByHour(records), [records]);

  const items = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        volume: vol.get(rhKey(r.date, r.shiftId, r.hour, r.division)) ?? 0,
      })),
    [rows, vol],
  );

  const by = (d?: DivisionType) => consolidate(items.filter((i) => !d || i.division === d));
  const all = by();
  const int = by("INTERNO");
  const ext = by("EXTERNO");
  const tracked = items.filter((i) => i.actual != null);
  const turnos = new Set(tracked.map((i) => `${i.date}|${i.shiftId}`)).size;
  const horas = new Set(tracked.map((i) => `${i.date}|${i.shiftId}|${i.hour}`)).size;

  const porDia = useMemo(() => {
    const dates = [...new Set(items.map((i) => i.date))].sort();
    return dates.map((d) => {
      const day = items.filter((i) => i.date === d);
      return {
        date: d,
        int: consolidate(day.filter((i) => i.division === "INTERNO")),
        ext: consolidate(day.filter((i) => i.division === "EXTERNO")),
      };
    });
  }, [items]);

  const cards: [string, string][] = [
    ["Volume total recebido", fmtNum(all.volume, 0)],
    ["Recursos-hora total", fmtNum(all.resourceHours, 0)],
    ["Recursos médios por hora", fmtNum(horas ? all.resourceHours / horas : null)],
    ["Produtividade média mensal", fmtNum(all.productivity)],
    ["Produtividade Interno", fmtNum(int.productivity)],
    ["Produtividade Externo", fmtNum(ext.productivity)],
    ["Turnos acompanhados", String(turnos)],
    ["Horas acompanhadas", String(horas)],
  ];

  return (
    <section className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-brand" />
        <h2 className="font-display text-base font-semibold">Recursos e Produtividade do Mês</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-[11px] font-medium uppercase text-muted-foreground">{l}</div>
            <div className="mt-1 font-display text-xl font-bold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {([["Recebimento Interno", int], ["Recebimento Externo", ext]] as const).map(([t, c]) => (
          <div key={t} className="rounded-lg border border-border p-3 text-sm">
            <div className="font-semibold">{t} — Planejado x Real</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Planejado {fmtNum(c.planned, 0)} · Real {fmtNum(c.resourceHours, 0)} recursos-hora ·
              Aderência <span className="font-semibold text-foreground">{fmtPct(c.adherence)}</span>
            </div>
          </div>
        ))}
      </div>

      {porDia.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-2 py-2 text-left">Dia</th>
                <th className="px-2 py-2 text-right">Prod. Int.</th>
                <th className="px-2 py-2 text-right">Aderência Int.</th>
                <th className="px-2 py-2 text-right">Prod. Ext.</th>
                <th className="px-2 py-2 text-right">Aderência Ext.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {porDia.map((d) => (
                <tr key={d.date}>
                  <td className="px-2 py-1.5">{formatDateBR(d.date)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmtNum(d.int.productivity)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmtPct(d.int.adherence)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmtNum(d.ext.productivity)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmtPct(d.ext.adherence)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Produtividade mensal = volume total do mês ÷ recursos-hora reais do mês (sem média simples de turnos).
      </p>
    </section>
  );
}

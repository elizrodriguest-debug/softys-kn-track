import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { TURNOS, isConforme, type Registro } from "@/lib/types";
import { exportCSV, exportPDF } from "@/lib/export";

const AZUL = "#003369";
const VERDE = "#08C792";
const AMBAR = "#F59E0B";

function agregar(rs: Registro[]) {
  const volumes = rs.reduce((a, r) => a + r.volumes, 0);
  const conformes = rs.filter(isConforme).length;
  return {
    descargas: rs.length,
    volumes,
    conformes,
    divergentes: rs.length - conformes,
    taxa: rs.length ? Math.round((conformes / rs.length) * 1000) / 10 : 100,
  };
}

function RelatorioMensal() {
  const { registros } = useStore();
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));

  const doMes = useMemo(() => registros.filter((r) => r.data.startsWith(mes)), [registros, mes]);

  const linhas = useMemo(() => {
    const grupos: { chave: string; rs: Registro[] }[] = [
      { chave: "Recebimento Interno", rs: doMes.filter((r) => r.tipo === "INTERNO") },
      { chave: "Recebimento Externo", rs: doMes.filter((r) => r.tipo === "EXTERNO") },
      { chave: "Divisão Tissue", rs: doMes.filter((r) => r.divisao === "TISSUE") },
      { chave: "Divisão Personal", rs: doMes.filter((r) => r.divisao === "PERSONAL") },
      ...TURNOS.map((t) => ({
        chave: `${t.label} (${t.faixa})`,
        rs: doMes.filter((r) => r.turno === t.id),
      })),
    ];
    return grupos.map((g) => ({ chave: g.chave, ...agregar(g.rs) }));
  }, [doMes]);

  const total = agregar(doMes);

  const porDia = useMemo(() => {
    const map = new Map<string, Registro[]>();
    for (const r of doMes) map.set(r.data, [...(map.get(r.data) ?? []), r]);
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([data, rs]) => ({
        dia: data.slice(8),
        Conformes: rs.filter(isConforme).length,
        Divergentes: rs.filter((r) => !isConforme(r)).length,
      }));
  }, [doMes]);

  return (
    <div className="space-y-5">
      <div className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center no-print">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Mês de referência</label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            onClick={() =>
              exportCSV(
                `relatorio-mensal-${mes}.csv`,
                linhas.map((l) => ({
                  Segmento: l.chave,
                  Descargas: l.descargas,
                  Volumes: l.volumes,
                  "Sem anomalias": l.conformes,
                  "Com divergências": l.divergentes,
                  "Conformidade %": l.taxa,
                })),
              )
            }
          >
            <Download className="h-4 w-4" /> Excel (CSV)
          </Button>
          <Button onClick={exportPDF}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { t: "Descargas no mês", v: total.descargas.toLocaleString("pt-BR") },
          { t: "Volumes recebidos", v: total.volumes.toLocaleString("pt-BR") },
          { t: "Descargas sem anomalias", v: total.conformes.toLocaleString("pt-BR") },
          { t: "Taxa de conformidade", v: `${total.taxa}%` },
        ].map((c) => (
          <div key={c.t} className="card-surface p-5">
            <p className="text-sm font-medium text-muted-foreground">{c.t}</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{c.v}</p>
          </div>
        ))}
      </div>

      <div className="card-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-display text-base font-semibold">Resumo consolidado</h3>
          <p className="text-xs text-muted-foreground">Referência {mes.split("-").reverse().join("/")}</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60">
                <TableHead>Segmento</TableHead>
                <TableHead className="text-right">Descargas</TableHead>
                <TableHead className="text-right">Volumes</TableHead>
                <TableHead className="text-right">Sem anomalias</TableHead>
                <TableHead className="text-right">Com divergências</TableHead>
                <TableHead className="text-right">Conformidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.chave}>
                  <TableCell className="font-medium">{l.chave}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.descargas}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {l.volumes.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-success-foreground">
                    {l.conformes}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-danger">
                    {l.divergentes}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{l.taxa}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="card-surface p-5">
        <h3 className="font-display text-base font-semibold">Evolução diária do mês</h3>
        <p className="text-xs text-muted-foreground">Descargas conformes x divergentes</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porDia}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Conformes" stackId="a" fill={VERDE} />
              <Bar dataKey="Divergentes" stackId="a" fill={AMBAR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground" style={{ color: AZUL }}>
          Parceria operacional Softys × Kuehne+Nagel
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/relatorio-mensal")({
  head: () => ({
    meta: [
      { title: "Relatório Mensal Consolidado | Inbound Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Consolidação mensal de volumes recebidos, divergências e taxa de conformidade do inbound logístico.",
      },
      { property: "og:title", content: "Relatório Mensal Consolidado | Inbound" },
      {
        property: "og:description",
        content: "Totalizações mensais com exportação em Excel e PDF.",
      },
    ],
  }),
  component: () => (
    <AppShell
      title="Relatório Mensal Consolidado"
      subtitle="Totalizações, conformidade e exportação dos indicadores do mês."
      perfis={["AUDITOR", "ADMIN"]}
    >
      <RelatorioMensal />
    </AppShell>
  ),
});

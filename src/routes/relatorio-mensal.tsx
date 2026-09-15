import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { computeKpis, sumNonConformity } from "@/lib/analytics";
import {
  DIVISION_LABEL,
  DIVISION_OWNER,
  EXTERNAL_OPERATIONS,
  FACTORIES,
  SHIFTS,
  formatDateBR,
  isConforme,
  nonConformities,
  recordVolumes,
  type DischargeRecord,
  type DivisionType,
} from "@/lib/types";
import { exportCSV } from "@/lib/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relatorio-mensal")({
  head: () => ({
    meta: [
      { title: "Relatório Mensal | Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Consolidado mensal do recebimento interno e externo: descargas, volumes, conformidade e cumprimento diário de metas.",
      },
      { property: "og:title", content: "Relatório Mensal | Softys × Kuehne+Nagel" },
      {
        property: "og:description",
        content: "Visão acumulada do mês por divisão, com subtotais, gráficos e exportação CSV.",
      },
    ],
  }),
  component: RelatorioMensalPage,
});

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const COLORS = { tissue: "#10b981", personal: "#6366f1", brand: "#003369", ambar: "#F59E0B" };

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <strong className="tabular-nums text-foreground">{value.toLocaleString("pt-BR")}</strong>
    </span>
  );
}

function DailyGoalChart({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey: "Interno" | "Externo";
  color: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-display text-base font-semibold">Relação diária de cumprimento de metas</h2>
      <p className="mt-1 text-xs text-muted-foreground">{title}</p>
      <div className="mt-4 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function DivisionPanel({
  division,
  records,
  goalPerShift,
  anchorId,
}: {
  division: DivisionType;
  records: DischargeRecord[];
  goalPerShift: number;
  anchorId: string;
}) {
  const rs = records.filter((r) => r.division === division);
  const kpis = computeKpis(rs, goalPerShift);
  const pills =
    division === "INTERNO"
      ? [
          ...FACTORIES.map((f) => ({
            label: f,
            value: rs.filter((r) => r.factoryType === f).length,
          })),
          { label: "Pallets Tombados", value: sumNonConformity(rs, "Pallets Tombados") },
          { label: "Pallets Quebrados", value: sumNonConformity(rs, "Pallets Quebrados") },
          { label: "Divergências de ASN", value: sumNonConformity(rs, "Divergência de ASN") },
        ]
      : [
          ...EXTERNAL_OPERATIONS.map((o) => ({
            label: o === "Transferências Filiais" ? "Filiais" : o,
            value: rs.filter((r) => r.operationType === o).length,
          })),
          {
            label: "Divergência de Quantidade",
            value: sumNonConformity(rs, "Divergência de Quantidade"),
          },
          { label: "Avarias", value: sumNonConformity(rs, "Produtos Avariados") },
        ];

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-foreground">
          {DIVISION_LABEL[division]}
        </h2>
        <p className="text-xs text-muted-foreground">{DIVISION_OWNER[division]}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg p-4" style={{ background: "#edf5fd" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Descargas no mês
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{kpis.vehicles}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Volumes recebidos
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
            {kpis.volumes.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-lg p-4" style={{ background: "#eafaf1" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Sem anomalia
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-600">{kpis.conformes}</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: "#fef2f2" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Taxa de conformidade
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
            {kpis.conformityRate}%
          </p>
          <p className="text-[11px] text-slate-600">{kpis.nonConformes} com divergência</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {pills.map((p) => (
          <Pill key={p.label} label={p.label} value={p.value} />
        ))}
        <a
          href={`#${anchorId}`}
          className="ml-auto text-xs font-medium text-brand underline-offset-2 hover:underline"
        >
          Ver detalhes ↓
        </a>
      </div>
    </section>
  );
}

function RelatorioMensalPage() {
  const { records, settings } = useStore();
  const now = new Date();

  const [mes, setMes] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [ano, setAno] = useState(String(now.getFullYear()));
  const [view, setView] = useState<"AMBOS" | DivisionType>("AMBOS");

  const [fDivision, setFDivision] = useState<DivisionType>("INTERNO");
  const [fKey, setFKey] = useState("TODOS");
  const [fShift, setFShift] = useState("TODOS");
  const [query, setQuery] = useState("");

  const prefix = `${ano}-${mes}`;
  const doMes = useMemo(() => records.filter((r) => r.date.startsWith(prefix)), [records, prefix]);

  const anos = useMemo(() => {
    const set = new Set(records.map((r) => r.date.slice(0, 4)));
    set.add(String(now.getFullYear()));
    return [...set].sort().reverse();
  }, [records, now]);

  const detalhe = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doMes
      .filter((r) => r.division === fDivision)
      .filter((r) => (fShift === "TODOS" ? true : r.shiftId === fShift))
      .filter((r) =>
        fKey === "TODOS"
          ? true
          : fDivision === "INTERNO"
            ? r.factoryType === fKey
            : r.operationType === fKey,
      )
      .filter((r) =>
        q
          ? [r.asnNumber, r.invoiceNumber].filter(Boolean).some((v) =>
              String(v).toLowerCase().includes(q),
            )
          : true,
      )
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [doMes, fDivision, fShift, fKey, query]);

  const porDia = useMemo(() => {
    const dias = [...new Set(doMes.map((r) => r.date))].sort();
    return dias.map((d) => {
      const rs = doMes.filter((r) => r.date === d);
      return {
        dia: formatDateBR(d).slice(0, 5),
        Interno: rs.filter((r) => r.division === "INTERNO").length,
        Externo: rs.filter((r) => r.division === "EXTERNO").length,
        MetaInterna: settings.goals.INTERNO * 3,
        MetaExterna: settings.goals.EXTERNO * 3,
      };
    });
  }, [doMes, settings]);

  const exportar = () => {
    exportCSV(
      `relatorio-mensal-${prefix}.csv`,
      doMes.map((r) => ({
        Data: formatDateBR(r.date),
        Hora: r.time,
        Turno: r.shiftId,
        Divisao: DIVISION_LABEL[r.division],
        Origem: r.factoryType ?? r.operationType ?? "",
        Documento: r.asnNumber || r.invoiceNumber || "",
        Volumes: recordVolumes(r),
        Conforme: isConforme(r) ? "Sim" : "Não",
        Ocorrencias: nonConformities(r)
          .map((n) => `${n.label} (${n.quantity})`)
          .join(" | "),
      })),
    );
    toast.success("Planilha CSV exportada.");
  };

  return (
    <AppShell
      title="Relatório Mensal"
      subtitle="Consolidado e acumulado do recebimento interno e externo."
    >
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => (
              <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anos.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="inline-flex rounded-lg border border-border p-1">
          {(
            [
              ["AMBOS", "Lado a Lado"],
              ["INTERNO", DIVISION_LABEL.INTERNO],
              ["EXTERNO", DIVISION_LABEL.EXTERNO],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === v ? "bg-brand text-brand-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Button variant="outline" className="ml-auto" onClick={exportar}>
          <Download className="mr-2 h-4 w-4" />
          Exportar .CSV
        </Button>
      </div>

      <div className={cn("grid gap-5", view === "AMBOS" && "xl:grid-cols-2")}>
        {(view === "AMBOS" || view === "INTERNO") && (
          <DivisionPanel
            division="INTERNO"
            records={doMes}
            goalPerShift={settings.goals.INTERNO * 3 * (porDia.length || 1)}
            anchorId="detalhamento"
          />
        )}
        {(view === "AMBOS" || view === "EXTERNO") && (
          <DivisionPanel
            division="EXTERNO"
            records={doMes}
            goalPerShift={settings.goals.EXTERNO * 3 * (porDia.length || 1)}
            anchorId="detalhamento"
          />
        )}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <DailyGoalChart
          title="Recebimento Interno"
          data={porDia}
          dataKey="Interno"
          color={COLORS.brand}
        />
        <DailyGoalChart
          title="Recebimento Externo"
          data={porDia}
          dataKey="Externo"
          color={COLORS.tissue}
        />
      </div>

      <section id="detalhamento" className="mt-5 scroll-mt-28">
        <h2 className="mb-3 font-display text-base font-semibold">Detalhamento operacional</h2>

        <div className="mb-3 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-4">
          <Select
            value={fDivision}
            onValueChange={(v) => {
              setFDivision(v as DivisionType);
              setFKey("TODOS");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INTERNO">{DIVISION_LABEL.INTERNO}</SelectItem>
              <SelectItem value="EXTERNO">{DIVISION_LABEL.EXTERNO}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fKey} onValueChange={setFKey}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">
                {fDivision === "INTERNO" ? "Todas as fábricas" : "Todas as operações"}
              </SelectItem>
              {(fDivision === "INTERNO" ? FACTORIES : EXTERNAL_OPERATIONS).map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fShift} onValueChange={setFShift}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os turnos</SelectItem>
              {SHIFTS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar ASN / NF"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>{fDivision === "INTERNO" ? "Fábrica" : "Operação"}</TableHead>
                <TableHead>{fDivision === "INTERNO" ? "ASN" : "NF"}</TableHead>
                <TableHead className="text-right">Volumes</TableHead>
                <TableHead>Ocorrências</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalhe.slice(0, 300).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{formatDateBR(r.date)}</TableCell>
                  <TableCell>{r.shiftId}</TableCell>
                  <TableCell>{r.factoryType ?? r.operationType ?? "—"}</TableCell>
                  <TableCell>{r.asnNumber || r.invoiceNumber || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{recordVolumes(r)}</TableCell>
                  <TableCell className="text-xs">
                    {nonConformities(r)
                      .map((n) => `${n.label} (${n.quantity})`)
                      .join(", ") || "Conforme"}
                  </TableCell>
                </TableRow>
              ))}
              {detalhe.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum registro no período selecionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </AppShell>
  );
}

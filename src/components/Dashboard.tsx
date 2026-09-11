import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, History, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import {
  DIVISION_LABEL,
  DIVISION_OWNER,
  EXTERNAL_OPERATIONS,
  FACTORIES,
  FACTORY_COLORS,
  SHIFTS,
  formatDateBR,
  type DischargeRecord,
  type DivisionType,
  type ShiftId,
} from "@/lib/types";
import { byHourSeries, byShiftSeries, computeKpis, paretoSeries } from "@/lib/analytics";
import { ShiftClosureModal } from "@/components/ShiftClosureModal";
import { cn } from "@/lib/utils";

type DateFilter = "HOJE" | "ONTEM" | "7D" | "TUDO" | "DIA";
type ShiftFilter = ShiftId | "GERAL";

const OPERATION_COLORS: Record<string, string> = {
  "Importação": "#003369",
  "Transferências Filiais": "#08C792",
  "Devolução": "#f59e0b",
  "Retrabalho": "#6366f1",
};

function isoToday(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

export function Dashboard() {
  const { records, session, getLogbook, saveLogbook, settings, logbook } = useStore();
  const [division, setDivision] = useState<DivisionType>("INTERNO");
  const [dateFilter, setDateFilter] = useState<DateFilter>("HOJE");
  const [specificDate, setSpecificDate] = useState(isoToday());
  const [shift, setShift] = useState<ShiftFilter>("GERAL");
  const [closureOpen, setClosureOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { filtered, days, refDate } = useMemo(() => {
    const today = isoToday();
    let base = records.filter((r) => r.division === division);
    let dias = 1;
    let ref = today;
    if (dateFilter === "HOJE") base = base.filter((r) => r.date === today);
    else if (dateFilter === "ONTEM") {
      ref = isoToday(1);
      base = base.filter((r) => r.date === ref);
    } else if (dateFilter === "7D") {
      const min = isoToday(6);
      base = base.filter((r) => r.date >= min && r.date <= today);
      dias = 7;
    } else if (dateFilter === "DIA") {
      ref = specificDate;
      base = base.filter((r) => r.date === specificDate);
    } else {
      dias = new Set(base.map((r) => r.date)).size || 1;
    }
    if (shift !== "GERAL") base = base.filter((r) => r.shiftId === shift);
    return { filtered: base, days: dias, refDate: ref };
  }, [records, division, dateFilter, specificDate, shift]);

  const goalPerShift = settings.goals[division];
  const goal = goalPerShift * (shift === "GERAL" ? 3 : 1) * days;
  const kpis = useMemo(() => computeKpis(filtered, goal), [filtered, goal]);

  const shiftSeries = useMemo(() => byShiftSeries(filtered, division), [filtered, division]);
  const hourSeries = useMemo(() => byHourSeries(filtered), [filtered]);
  const pareto = useMemo(() => paretoSeries(filtered), [filtered]);

  const seriesKeys = division === "INTERNO" ? FACTORIES : EXTERNAL_OPERATIONS;
  const seriesColor = (k: string) =>
    division === "INTERNO" ? FACTORY_COLORS[k as "Tissue" | "Personal"] : (OPERATION_COLORS[k] ?? "#003369");

  const closureShift: ShiftId = shift === "GERAL" ? session.shiftId : shift;
  const closureDate = dateFilter === "TUDO" || dateFilter === "7D" ? isoToday() : refDate;
  const logEntry = getLogbook(closureDate, closureShift);
  const [notes, setNotes] = useState<string | null>(null);
  const notesValue = notes ?? logEntry?.notes ?? "";

  const goalOk = kpis.attainment >= 100;

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="card-surface flex flex-col gap-3 p-4 no-print xl:flex-row xl:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            ["HOJE", "Hoje"],
            ["ONTEM", "Ontem"],
            ["7D", "Últimos 7 Dias"],
            ["TUDO", "Ver Tudo"],
          ] as const).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={dateFilter === id ? "default" : "outline"}
              onClick={() => setDateFilter(id)}
            >
              {label}
            </Button>
          ))}
          <Input
            type="date"
            value={specificDate}
            onChange={(e) => {
              setSpecificDate(e.target.value);
              setDateFilter("DIA");
            }}
            className={cn("w-[165px]", dateFilter === "DIA" && "border-primary ring-1 ring-primary")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
          <Select value={shift} onValueChange={(v) => setShift(v as ShiftFilter)}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GERAL">Turno Geral</SelectItem>
              {SHIFTS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label} ({s.range})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-border p-0.5">
            {(["INTERNO", "EXTERNO"] as DivisionType[]).map((d) => (
              <button
                key={d}
                onClick={() => setDivision(d)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  division === d
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {DIVISION_LABEL[d]}
              </button>
            ))}
          </div>

          <Button onClick={() => setClosureOpen(true)}>
            <Mail className="h-4 w-4" /> Fechamento de Turno (E-mail)
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          title="Veículos Descarregados vs. Meta"
          value={`${kpis.vehicles} / ${goal}`}
          hint={`${DIVISION_OWNER[division]} · ${shift === "GERAL" ? "todos os turnos" : shift}`}
        />
        <KpiCard
          index={1}
          title="Volumes / Pallets Recebidos"
          value={kpis.volumes.toLocaleString("pt-BR")}
          hint={`${filtered.length} descargas no filtro`}
        />
        <KpiCard
          index={2}
          title="Taxa de Conformidade"
          value={`${kpis.conformityRate}%`}
          hint={`${kpis.nonConformes} com não-conformidade`}
          tone={kpis.nonConformes === 0 ? "success" : "warning"}
        />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-surface p-5"
        >
          <p className="text-sm font-medium text-muted-foreground">
            Meta do Turno {shift === "GERAL" ? "(Geral)" : shift}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="font-display text-3xl font-bold tabular-nums">{kpis.attainment}%</p>
            <Badge className={goalOk ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
              {goalOk ? "Meta Atingida" : "Abaixo da Meta"}
            </Badge>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className={cn("h-full rounded-full", goalOk ? "bg-success" : "bg-warning")}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, kpis.attainment)}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Meta de {goalPerShift} veículos por turno · {goal} no período filtrado
          </p>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card-surface p-5">
          <h3 className="font-display text-base font-semibold">
            Veículos Descarregados por Turno e {division === "INTERNO" ? "Fábrica" : "Operação"}
          </h3>
          <p className="text-xs text-muted-foreground">Barras empilhadas com total por turno</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftSeries} margin={{ top: 24 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="turno" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {seriesKeys.map((k, i) => (
                  <Bar key={k} dataKey={k} stackId="a" fill={seriesColor(k)} radius={i === seriesKeys.length - 1 ? [6, 6, 0, 0] : 0}>
                    <LabelList dataKey={k} position="center" fill="#fff" fontSize={11} formatter={(v: number) => (v > 0 ? v : "")} />
                    {i === seriesKeys.length - 1 && (
                      <LabelList dataKey="total" position="top" fontSize={12} fontWeight={700} />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="font-display text-base font-semibold">Produtividade por Hora</h3>
          <p className="text-xs text-muted-foreground">Distribuição das descargas por faixa de horário</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hora" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Descargas" stroke="#003369" strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-surface p-5">
        <h3 className="font-display text-base font-semibold">Pareto de Ocorrências</h3>
        <p className="text-xs text-muted-foreground">
          Principais motivos de anomalia em ordem decrescente
        </p>
        <div className="mt-4 h-80">
          {pareto.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Nenhuma ocorrência registrada no filtro selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pareto} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="motivo" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={60} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="l" dataKey="Ocorrências" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="Ocorrências" position="top" fontSize={11} />
                </Bar>
                <Line yAxisId="r" type="monotone" dataKey="Acumulado" stroke="#003369" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Diário de Bordo */}
      <div className="card-surface p-5 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand" />
          <h3 className="font-display text-base font-semibold">Diário de Bordo</h3>
          <span className="text-xs text-muted-foreground">
            {formatDateBR(closureDate)} · {closureShift} · {session.operatorName}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Justificativas operacionais do turno ativo (atraso de carretas, queda de sistema WMS,
          docas indisponíveis).
        </p>
        <Textarea
          className="mt-3 min-h-28"
          value={notesValue}
          placeholder="Descreva as ocorrências e justificativas do turno..."
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              saveLogbook(closureDate, closureShift, notesValue);
              setNotes(null);
            }}
          >
            <Save className="h-4 w-4" /> Salvar apontamento
          </Button>
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4" /> Histórico de apontamentos
          </Button>
          <Button variant="outline" onClick={() => setClosureOpen(true)}>
            <Mail className="h-4 w-4" /> Enviar fechamento por e-mail
          </Button>
        </div>
      </div>

      <ShiftClosureModal
        open={closureOpen}
        onOpenChange={setClosureOpen}
        division={division}
        shiftId={closureShift}
        date={closureDate}
        records={filtered}
        goal={goal}
      />

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de apontamentos</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {logbook.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum apontamento registrado.</p>
            )}
            {[...logbook]
              .sort((a, b) => (a.id < b.id ? 1 : -1))
              .map((l) => (
                <div key={l.id} className="rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold text-brand">
                    {formatDateBR(l.date)} · {l.shiftId} · {l.authorName}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{l.notes}</p>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  tone,
  index,
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "success" | "warning";
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card-surface p-5"
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p
        className={cn(
          "mt-1 font-display text-3xl font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}

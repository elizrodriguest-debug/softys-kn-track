import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BookMarked,
  Boxes,
  CheckCircle2,
  FileWarning,
  PackageX,
  Save,
  Tags,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { podeEditar, useStore } from "@/lib/store";
import {
  METAS,
  TURNOS,

  isConforme,
  type Registro,
  type Turno,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const AZUL = "#003369";
const VERDE = "#08C792";
const AMBAR = "#F59E0B";
const VERMELHO = "#DC2626";

const hojeISO = () => new Date().toISOString().slice(0, 10);
const fmtData = (d: string) => d.split("-").reverse().slice(0, 2).join("/");

function Kpi({
  titulo,
  valor,
  meta,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  meta: number;
  icone: typeof Truck;
}) {
  const pct = meta > 0 ? Math.min(100, Math.round((valor / meta) * 100)) : 0;
  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{titulo}</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">
            {valor}
            <span className="ml-1 text-base font-medium text-muted-foreground">/ {meta}</span>
          </p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-brand">
          <Icone className="h-5 w-5" />
        </div>
      </div>
      <Progress value={pct} className="mt-4 h-2" />
      <p className="mt-2 text-xs text-muted-foreground">
        {pct}% da meta do período{" "}
        {pct >= 100 && <span className="font-semibold text-success">· meta atingida</span>}
      </p>
    </div>
  );
}

function AnomaliaCard({
  titulo,
  valor,
  icone: Icone,
  tom,
}: {
  titulo: string;
  valor: number;
  icone: typeof Truck;
  tom: "warn" | "crit" | "ok";
}) {
  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          tom === "crit" && "bg-danger/12 text-danger",
          tom === "warn" && "bg-warning/20 text-warning-foreground",
          tom === "ok" && "bg-success/15 text-success-foreground",
        )}
      >
        <Icone className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold leading-none tabular-nums">{valor}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{titulo}</p>
      </div>
    </div>
  );
}

function ChartCard({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface p-5">
      <h3 className="font-display text-base font-semibold">{titulo}</h3>
      {descricao && <p className="mb-2 text-xs text-muted-foreground">{descricao}</p>}
      <div className="mt-3 h-64">{children}</div>
    </div>
  );
}

export function Dashboard() {
  const { registros, diarios, salvarDiario, usuarioAtual } = useStore();
  const [data, setData] = useState(hojeISO());
  const [turno, setTurno] = useState<Turno | "TODOS">("TODOS");
  const [texto, setTexto] = useState("");
  const [carregouDiario, setCarregouDiario] = useState<string | null>(null);

  const doDia = useMemo(() => registros.filter((r) => r.data === data), [registros, data]);
  const filtrados = useMemo(
    () => (turno === "TODOS" ? doDia : doDia.filter((r) => r.turno === turno)),
    [doDia, turno],
  );

  const soma = (rs: Registro[], k: keyof Registro) =>
    rs.reduce((a, r) => a + (Number(r[k]) || 0), 0);

  const internos = filtrados.filter((r) => r.tipo === "INTERNO");
  const externos = filtrados.filter((r) => r.tipo === "EXTERNO");
  const fator = turno === "TODOS" ? 3 : 1;

  const conformes = filtrados.filter(isConforme).length;
  const taxa = filtrados.length ? Math.round((conformes / filtrados.length) * 100) : 100;

  const porTurno = TURNOS.map((t) => ({
    turno: t.label,
    Interno: doDia.filter((r) => r.turno === t.id && r.tipo === "INTERNO").length,
    Externo: doDia.filter((r) => r.turno === t.id && r.tipo === "EXTERNO").length,
    Ocorrências: doDia.filter((r) => r.turno === t.id && !isConforme(r)).length,
  }));

  const tendencia = useMemo(() => {
    const dias: { dia: string; descargas: number; conformidade: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(data);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const rs = registros.filter((r) => r.data === iso);
      dias.push({
        dia: fmtData(iso),
        descargas: rs.length,
        conformidade: rs.length ? Math.round((rs.filter(isConforme).length / rs.length) * 100) : 0,
      });
    }
    return dias;
  }, [registros, data]);

  const distribuicao = [
    { name: "Pallets quebrados", value: soma(filtrados, "palletsQuebrados"), cor: VERMELHO },
    { name: "Pallets tombados", value: soma(filtrados, "palletsTombados"), cor: AMBAR },
    { name: "iLPN ausente/inválida", value: soma(filtrados, "ilpnAusentes") + soma(filtrados, "ilpnInvalidas"), cor: AZUL },
    { name: "Divergência de caixas", value: soma(filtrados, "divergenciaCaixas"), cor: "#7C3AED" },
    { name: "Produtos avariados", value: soma(filtrados, "produtosAvariados"), cor: "#0EA5E9" },
  ].filter((d) => d.value > 0);

  const diarioId = `${data}|${turno === "TODOS" ? "T1" : turno}`;
  const diarioAtual = diarios.find((d) => d.id === diarioId);
  if (carregouDiario !== diarioId) {
    setCarregouDiario(diarioId);
    setTexto(diarioAtual?.texto ?? "");
  }

  return (
    <div className="space-y-5">
      <div className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <label className="whitespace-nowrap text-sm font-medium text-muted-foreground">
            Data
          </label>
          <Input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-[170px]"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {(["TODOS", "T1", "T2", "T3"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={turno === t ? "default" : "outline"}
              onClick={() => setTurno(t)}
            >
              {t === "TODOS" ? "Todos os turnos" : `${t} · ${TURNOS.find((x) => x.id === t)!.faixa}`}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titulo="Descargas — Interno"
          valor={internos.length}
          meta={METAS.INTERNO * fator}
          icone={Truck}
        />
        <Kpi
          titulo="Descargas — Externo"
          valor={externos.length}
          meta={METAS.EXTERNO * fator}
          icone={Boxes}
        />
        <div className="card-surface p-5">
          <p className="text-sm font-medium text-muted-foreground">Taxa de conformidade</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-success-foreground">
            {taxa}%
          </p>
          <Progress value={taxa} className="mt-4 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {conformes} de {filtrados.length} descargas sem anomalias
          </p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm font-medium text-muted-foreground">Volumes recebidos</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">
            {soma(filtrados, "volumes").toLocaleString("pt-BR")}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Total de pallets/volumes conferidos no período selecionado
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AnomaliaCard
          titulo="Veículos sem ASN"
          valor={filtrados.filter((r) => r.semAsn).length}
          icone={FileWarning}
          tom="crit"
        />
        <AnomaliaCard
          titulo="iLPNs ausentes"
          valor={soma(filtrados, "ilpnAusentes")}
          icone={Tags}
          tom="warn"
        />
        <AnomaliaCard
          titulo="iLPNs inválidas"
          valor={soma(filtrados, "ilpnInvalidas")}
          icone={Tags}
          tom="warn"
        />
        <AnomaliaCard
          titulo="Pallets quebrados"
          valor={soma(filtrados, "palletsQuebrados")}
          icone={PackageX}
          tom="crit"
        />
        <AnomaliaCard
          titulo="Pallets tombados"
          valor={soma(filtrados, "palletsTombados")}
          icone={AlertTriangle}
          tom="warn"
        />
        <AnomaliaCard
          titulo="Divergências / avarias"
          valor={soma(filtrados, "divergenciaCaixas") + soma(filtrados, "produtosAvariados")}
          icone={CheckCircle2}
          tom="crit"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard titulo="Desempenho por turno" descricao="Descargas realizadas no dia selecionado">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porTurno}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="turno" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Interno" fill={AZUL} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Externo" fill={VERDE} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Ocorrências" fill={AMBAR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          titulo="Tendência de 14 dias"
          descricao="Volume de descargas e evolução da conformidade (%)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tendencia}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="l"
                type="monotone"
                dataKey="descargas"
                name="Descargas"
                stroke={AZUL}
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="r"
                type="monotone"
                dataKey="conformidade"
                name="Conformidade %"
                stroke={VERDE}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titulo="Distribuição das ocorrências" descricao="Período selecionado">
          {distribuicao.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribuicao}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {distribuicao.map((d) => (
                    <Cell key={d.name} fill={d.cor} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Nenhuma ocorrência registrada no período.
            </div>
          )}
        </ChartCard>

        <div className="card-surface p-5">
          <div className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-brand" />
            <h3 className="font-display text-base font-semibold">Diário de Bordo do Turno</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Justificativas operacionais do turno {turno === "TODOS" ? "T1" : turno} em{" "}
            {data.split("-").reverse().join("/")} — ex.: queda do WMS, falta de empilhadeiras,
            atraso fiscal.
          </p>
          <Textarea
            className="mt-3"
            rows={7}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={!podeEditar(usuarioAtual?.perfil)}
            placeholder="Registre aqui os gargalos e justificativas do turno..."
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {diarioAtual
                ? `Último registro por ${diarioAtual.autor}`
                : "Nenhum registro para este turno."}
            </p>
            {podeEditar(usuarioAtual?.perfil) && (
              <Button
                size="sm"
                onClick={() => {
                  salvarDiario(data, turno === "TODOS" ? "T1" : turno, texto);
                  toast.success("Diário de bordo salvo.");
                }}
              >
                <Save className="h-4 w-4" /> Salvar diário
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


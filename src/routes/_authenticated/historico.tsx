import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DIVISION_LABEL,
  EXTERNAL_OPERATIONS,
  FACTORIES,
  SHIFTS,
  formatDateBR,
  isConforme,
  nonConformities,
  recordVolumes,
  type DivisionType,
} from "@/lib/types";
import { exportCSV } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico e Consultas | Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Consulta das descargas registradas com filtros por período, turno, fábrica, operação e busca por ASN ou nota fiscal.",
      },
      { property: "og:title", content: "Histórico e Consultas | Softys × Kuehne+Nagel" },
      {
        property: "og:description",
        content: "Tabela completa de descargas com ocorrências e exportação em CSV.",
      },
    ],
  }),
  component: HistoricoPage,
});

function HistoricoPage() {
  const { records, deleteRecord } = useStore();

  const [division, setDivision] = useState<DivisionType>("INTERNO");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shift, setShift] = useState("TODOS");
  const [key, setKey] = useState("TODOS");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => r.division === division)
      .filter((r) => (from ? r.date >= from : true))
      .filter((r) => (to ? r.date <= to : true))
      .filter((r) => (shift === "TODOS" ? true : r.shiftId === shift))
      .filter((r) =>
        key === "TODOS"
          ? true
          : division === "INTERNO"
            ? r.factoryType === key
            : r.operationType === key,
      )
      .filter((r) =>
        q
          ? [r.asnNumber, r.invoiceNumber, r.licensePlate, r.carrierName, r.driverName]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [records, division, from, to, shift, key, query]);

  const exportar = () => {
    exportCSV(
      `historico-${division.toLowerCase()}.csv`,
      filtered.map((r) => ({
        Data: formatDateBR(r.date),
        Hora: r.time,
        Turno: r.shiftId,
        Divisao: DIVISION_LABEL[r.division],
        Origem: r.factoryType ?? r.operationType ?? "",
        Doca: r.dockNumber ?? "",
        Transportadora: r.carrierName ?? "",
        Placa: r.licensePlate ?? "",
        Motorista: r.driverName ?? "",
        Volumes: recordVolumes(r),
        Documento: r.asnNumber || r.invoiceNumber || "",
        Ocorrencias: nonConformities(r)
          .map((n) => `${n.label} (${n.quantity})`)
          .join(" | "),
      })),
    );
    toast.success("Arquivo CSV gerado.");
  };

  return (
    <AppShell
      title="Histórico / Consultas"
      subtitle="Consulta das descargas registradas com filtros avançados e exportação."
    >
      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-3 xl:grid-cols-6">
        <Select value={division} onValueChange={(v) => { setDivision(v as DivisionType); setKey("TODOS"); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INTERNO">{DIVISION_LABEL.INTERNO}</SelectItem>
            <SelectItem value="EXTERNO">{DIVISION_LABEL.EXTERNO}</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Select value={shift} onValueChange={setShift}>
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
        <Select value={key} onValueChange={setKey}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">
              {division === "INTERNO" ? "Todas as fábricas" : "Todas as operações"}
            </SelectItem>
            {(division === "INTERNO" ? FACTORIES : EXTERNAL_OPERATIONS).map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar ASN / NF / placa"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} descarga(s) encontradas ·{" "}
          {filtered.reduce((a, r) => a + recordVolumes(r), 0).toLocaleString("pt-BR")} volumes
        </p>
        <Button variant="outline" onClick={exportar}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>{division === "INTERNO" ? "Fábrica" : "Operação"}</TableHead>
              <TableHead>Doca</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>{division === "INTERNO" ? "ASN" : "NF"}</TableHead>
              <TableHead className="text-right">Volumes</TableHead>
              <TableHead>Ocorrências</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 300).map((r) => {
              const ncs = nonConformities(r);
              return (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{formatDateBR(r.date)}</TableCell>
                  <TableCell className="tabular-nums">{r.time}</TableCell>
                  <TableCell>{r.shiftId}</TableCell>
                  <TableCell>{r.factoryType ?? r.operationType ?? "—"}</TableCell>
                  <TableCell>{r.dockNumber ?? "—"}</TableCell>
                  <TableCell>{r.licensePlate ?? "—"}</TableCell>
                  <TableCell>{r.asnNumber || r.invoiceNumber || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{recordVolumes(r)}</TableCell>
                  <TableCell>
                    {isConforme(r) ? (
                      <Badge variant="secondary">Conforme</Badge>
                    ) : (
                      <span className="flex flex-wrap gap-1">
                        {ncs.map((n, i) => (
                          <Badge key={i} variant="destructive" className="font-normal">
                            {n.label} ({n.quantity})
                          </Badge>
                        ))}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Excluir registro"
                      onClick={() => {
                        deleteRecord(r.id);
                        toast.success("Registro excluído.");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                  Nenhuma descarga encontrada para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}

import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { podeEditar, useStore } from "@/lib/store";
import { anomaliasDoRegistro, TURNOS, type Registro, type TipoReceb } from "@/lib/types";
import { RegistroDialog } from "@/components/RegistroDialog";
import { exportCSV } from "@/lib/export";
import { OcorrenciaBadges } from "@/components/OcorrenciaBadges";

const hoje = () => new Date().toISOString().slice(0, 10);

export function RecebimentoPage({ tipo }: { tipo: TipoReceb }) {
  const { registros, usuarioAtual, excluirRegistro } = useStore();
  const [busca, setBusca] = useState("");
  const [data, setData] = useState("");
  const [turno, setTurno] = useState("TODOS");
  const [divisao, setDivisao] = useState("TODAS");
  const [dialogo, setDialogo] = useState(false);
  const [editando, setEditando] = useState<Registro | null>(null);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return registros
      .filter((r) => r.tipo === tipo)
      .filter((r) => (data ? r.data === data : true))
      .filter((r) => (turno === "TODOS" ? true : r.turno === turno))
      .filter((r) => (divisao === "TODAS" ? true : r.divisao === divisao))
      .filter((r) =>
        q
          ? [r.documento, r.placa, r.transportadora].some((v) => v.toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  }, [registros, tipo, data, turno, divisao, busca]);

  const editar = podeEditar(usuarioAtual?.perfil);
  const admin = usuarioAtual?.perfil === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="card-surface p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar ASN/NF, placa ou transportadora"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <Select value={turno} onValueChange={setTurno}>
            <SelectTrigger>
              <SelectValue placeholder="Turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os turnos</SelectItem>
              {TURNOS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={divisao} onValueChange={setDivisao}>
            <SelectTrigger>
              <SelectValue placeholder="Divisão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas as divisões</SelectItem>
              <SelectItem value="TISSUE">Tissue</SelectItem>
              <SelectItem value="PERSONAL">Personal</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportCSV(
                  `recebimento-${tipo.toLowerCase()}.csv`,
                  filtrados.map((r) => ({
                    Data: r.data,
                    Turno: r.turno,
                    Documento: r.documento,
                    Divisao: r.divisao,
                    Placa: r.placa,
                    Transportadora: r.transportadora,
                    Volumes: r.volumes,
                    Anomalias: anomaliasDoRegistro(r),
                  })),
                )
              }
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            {editar && (
              <Button
                onClick={() => {
                  setEditando(null);
                  setDialogo(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova descarga</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60">
                <TableHead>Data / Turno</TableHead>
                <TableHead>{tipo === "INTERNO" ? "ASN" : "Nota Fiscal"}</TableHead>
                <TableHead>Divisão</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead className="hidden md:table-cell">Transportadora</TableHead>
                <TableHead className="text-right">Volumes</TableHead>
                <TableHead>Ocorrências</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.slice(0, 200).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    <span className="font-medium">
                      {r.data.split("-").reverse().join("/")}
                    </span>
                    <span className="ml-2 text-muted-foreground">{r.turno}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.documento}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {r.divisao === "TISSUE" ? "Tissue" : "Personal"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.placa}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{r.transportadora}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.volumes}</TableCell>
                  <TableCell>
                    <OcorrenciaBadges registro={r} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {editar && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditando(r);
                            setDialogo(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {admin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            excluirRegistro(r.id);
                            toast.success("Registro excluído.");
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Nenhuma descarga encontrada com os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Exibindo {Math.min(filtrados.length, 200)} de {filtrados.length} descargas.
        </div>
      </div>

      <RegistroDialog
        open={dialogo}
        onOpenChange={setDialogo}
        tipo={tipo}
        data={data || hoje()}
        turno="T1"
        registro={editando}
      />
    </div>
  );
}

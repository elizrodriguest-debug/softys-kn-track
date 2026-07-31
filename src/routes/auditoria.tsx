import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
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
import { exportCSV } from "@/lib/export";

const TIPO_LABEL = { CRIACAO: "Criação", ALTERACAO: "Alteração", EXCLUSAO: "Exclusão" } as const;
const TIPO_CLASSE = {
  CRIACAO: "bg-success/15 text-success-foreground",
  ALTERACAO: "bg-warning/20 text-warning-foreground",
  EXCLUSAO: "bg-danger/12 text-danger",
} as const;

function Auditoria() {
  const { logs } = useStore();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("TODOS");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return logs
      .filter((l) => (tipo === "TODOS" ? true : l.tipo === tipo))
      .filter((l) => (q ? `${l.usuario} ${l.acao}`.toLowerCase().includes(q) : true));
  }, [logs, busca, tipo]);

  return (
    <div className="space-y-4">
      <div className="card-surface grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_200px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por usuário ou ação"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas as operações</SelectItem>
            <SelectItem value="CRIACAO">Criação</SelectItem>
            <SelectItem value="ALTERACAO">Alteração</SelectItem>
            <SelectItem value="EXCLUSAO">Exclusão</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() =>
            exportCSV(
              "historico-auditoria.csv",
              filtrados.map((l) => ({
                Data: new Date(l.ts).toLocaleDateString("pt-BR"),
                Hora: new Date(l.ts).toLocaleTimeString("pt-BR"),
                Usuario: l.usuario,
                Perfil: l.perfil,
                Acao: l.acao,
                Tipo: TIPO_LABEL[l.tipo],
              })),
            )
          }
        >
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60">
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Ação realizada</TableHead>
                <TableHead>Operação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(l.ts).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm tabular-nums">
                    {new Date(l.ts).toLocaleTimeString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-medium">{l.usuario}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.perfil}</TableCell>
                  <TableCell className="text-sm">{l.acao}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TIPO_CLASSE[l.tipo]}`}
                    >
                      {TIPO_LABEL[l.tipo]}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/auditoria")({
  head: () => ({
    meta: [
      { title: "Histórico de Auditoria | Inbound Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Trilha de auditoria com data, hora, usuário, perfil e tipo de operação realizada no sistema inbound.",
      },
      { property: "og:title", content: "Histórico de Auditoria | Inbound" },
      { property: "og:description", content: "Rastreabilidade completa das ações do sistema." },
    ],
  }),
  component: () => (
    <AppShell
      title="Histórico de Auditoria"
      subtitle="Trilha completa de criações, alterações e exclusões realizadas no sistema."
      perfis={["ADMIN"]}
    >
      <Auditoria />
    </AppShell>
  ),
});

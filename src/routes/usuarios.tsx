import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Pencil, Plus, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Perfil, Usuario } from "@/lib/types";

const LABEL: Record<Perfil, string> = {
  OPERADOR: "Operador",
  AUDITOR: "Auditor",
  ADMIN: "Administrador",
};

function Usuarios() {
  const { usuarios, salvarUsuario, alternarUsuario } = useStore();
  const [aberto, setAberto] = useState(false);
  const [edit, setEdit] = useState<Usuario | null>(null);
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("OPERADOR");
  const [pin, setPin] = useState("");

  const abrir = (u?: Usuario) => {
    setEdit(u ?? null);
    setNome(u?.nome ?? "");
    setPerfil(u?.perfil ?? "OPERADOR");
    setPin(u?.pin ?? "");
    setAberto(true);
  };

  const salvar = () => {
    if (nome.trim().length < 3) {
      toast.error("Informe o nome completo do usuário.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error("O PIN deve conter exatamente 4 dígitos.");
      return;
    }
    const base = { nome: nome.trim(), perfil, pin, ativo: edit?.ativo ?? true };
    salvarUsuario(edit ? { ...base, id: edit.id } : base);
    toast.success(edit ? "Usuário atualizado." : "Usuário cadastrado.");
    setAberto(false);
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => abrir()}>
          <Plus className="h-4 w-4" /> Novo usuário
        </Button>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60">
                <TableHead>Nome</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{LABEL[u.perfil]}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">••••</TableCell>
                  <TableCell>
                    <span
                      className={
                        u.ativo
                          ? "rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success-foreground"
                          : "rounded-full bg-danger/12 px-2 py-0.5 text-xs font-semibold text-danger"
                      }
                    >
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => abrir(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Redefinir PIN"
                        onClick={() => {
                          const novo = String(Math.floor(1000 + Math.random() * 9000));
                          salvarUsuario({ ...u, pin: novo });
                          toast.success(`Novo PIN de ${u.nome}: ${novo}`);
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          alternarUsuario(u.id);
                          toast.success("Status do usuário atualizado.");
                        }}
                      >
                        {u.ativo ? (
                          <UserX className="h-4 w-4 text-danger" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-success-foreground" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {edit ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Perfil de acesso</Label>
              <Select value={perfil} onValueChange={(v) => setPerfil(v as Perfil)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERADOR">Operador</SelectItem>
                  <SelectItem value="AUDITOR">Auditor</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>PIN de 4 dígitos</Label>
              <Input
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Gestão de Usuários | Inbound Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Cadastro de operadores, redefinição de PIN e ativação de contas do controle operacional inbound.",
      },
      { property: "og:title", content: "Gestão de Usuários | Inbound" },
      { property: "og:description", content: "Administração de perfis e credenciais de acesso." },
    ],
  }),
  component: () => (
    <AppShell
      title="Gestão de Usuários"
      subtitle="Cadastro, perfis de acesso, redefinição de PIN e ativação de contas."
      perfis={["ADMIN"]}
    >
      <Usuarios />
    </AppShell>
  ),
});

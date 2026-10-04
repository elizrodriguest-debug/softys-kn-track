import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2, Pencil, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { createUser, listAudit, listUsers, resetPin, updateUser } from "@/lib/admin.functions";
import type { AppRole, UserStatus } from "@/lib/auth-utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração | Controle de Recebimento" },
      { name: "description", content: "Controle de usuários, perfis, PIN e auditoria." },
      { property: "og:title", content: "Administração | Controle de Recebimento" },
      { property: "og:description", content: "Gestão de usuários e trilha de auditoria." },
    ],
  }),
  component: AdminPage,
});

type U = { id: string; fullName: string; username: string; status: string; role: string };
const ROLES: AppRole[] = ["OPERACIONAL", "VISUALIZADOR", "ADMINISTRADOR"];
const STATUSES: UserStatus[] = ["ATIVO", "INATIVO", "PENDENTE"];

function AdminPage() {
  const { can, ready } = useStore();
  if (ready && !can.admin) {
    return (
      <AppShell title="Administração">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <p className="text-sm">Acesso restrito a administradores.</p>
          <Link to="/" className="ml-auto text-sm underline">Voltar</Link>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell title="Administração" subtitle="Controle de usuários, perfis e auditoria.">
      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Controle de Usuários</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios"><Usuarios /></TabsContent>
        <TabsContent value="auditoria"><Auditoria /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Usuarios() {
  const fetchUsers = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const update = useServerFn(updateUser);
  const reset = useServerFn(resetPin);
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(U & { pin?: string }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pinFor, setPinFor] = useState<U | null>(null);
  const [newPin, setNewPin] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    fetchUsers().then(setUsers).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      if (isNew) {
        await create({ data: { fullName: editing.fullName, username: editing.username, pin: editing.pin ?? "", role: editing.role as AppRole, status: editing.status as UserStatus } });
        toast.success("Usuário criado.");
      } else {
        await update({ data: { id: editing.id, fullName: editing.fullName, role: editing.role as AppRole, status: editing.status as UserStatus } });
        toast.success("Usuário atualizado.");
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const savePin = async () => {
    if (!pinFor) return;
    setBusy(true);
    try {
      await reset({ data: { id: pinFor.id, pin: newPin } });
      toast.success("PIN redefinido.");
      setPinFor(null);
      setNewPin("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => { setIsNew(true); setEditing({ id: "", fullName: "", username: "", status: "ATIVO", role: "OPERACIONAL", pin: "" }); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Usuário</TableHead><TableHead>Perfil</TableHead><TableHead>Status</TableHead><TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>}
            {!loading && users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                <TableCell><Badge variant={u.status === "ATIVO" ? "default" : "destructive"}>{u.status}</Badge></TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Button size="sm" variant="ghost" onClick={() => { setIsNew(false); setEditing(u); }}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setPinFor(u)}><KeyRound className="mr-1 h-3.5 w-3.5" />Redefinir PIN</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isNew ? "Novo Usuário" : "Editar Usuário"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <Input placeholder="Nome completo" value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
              <Input placeholder="Usuário (ex: joao.silva)" value={editing.username} disabled={!isNew} onChange={(e) => setEditing({ ...editing, username: e.target.value })} />
              {isNew && <Input placeholder="PIN (4 a 8 dígitos)" inputMode="numeric" value={editing.pin} onChange={(e) => setEditing({ ...editing, pin: e.target.value.replace(/\D/g, "").slice(0, 8) })} />}
              <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter><Button onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pinFor} onOpenChange={(o) => !o && setPinFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Redefinir PIN — {pinFor?.fullName}</DialogTitle></DialogHeader>
          <Input placeholder="Novo PIN (4 a 8 dígitos)" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))} />
          <DialogFooter><Button onClick={savePin} disabled={busy}>Salvar PIN</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Auditoria() {
  const fetchAudit = useServerFn(listAudit);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAudit>>>([]);
  useEffect(() => { fetchAudit().then(setRows).catch((e) => toast.error(e.message)); }, [fetchAudit]);
  const TABLE: Record<string, string> = { discharge_records: "Cargas", logbook_entries: "Diário de Bordo", app_settings: "Configurações", profiles: "Usuários", user_roles: "Perfis" };
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>Data/hora</TableHead><TableHead>Usuário</TableHead><TableHead>Área</TableHead><TableHead>Ação</TableHead><TableHead>Registro</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
              <TableCell>{r.changed_by_name ?? "Sistema"}</TableCell>
              <TableCell>{TABLE[r.table_name] ?? r.table_name}</TableCell>
              <TableCell><Badge variant="secondary">{r.action}</Badge></TableCell>
              <TableCell className="font-mono text-xs">{r.record_id?.slice(0, 8)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Sem eventos.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}

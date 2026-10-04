import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidPin, normalizeUsername, pinToPassword, usernameToEmail } from "@/lib/auth-utils";
import { bootstrapAdmin, needsBootstrap } from "@/lib/admin.functions";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | Controle de Recebimento CD Caieiras" },
      { name: "description", content: "Acesso por Usuário e PIN ao controle de recebimento inbound." },
      { property: "og:title", content: "Entrar | Controle de Recebimento CD Caieiras" },
      { property: "og:description", content: "Acesso restrito por Usuário e PIN." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, profile } = useStore();
  const checkBootstrap = useServerFn(needsBootstrap);
  const doBootstrap = useServerFn(bootstrapAdmin);
  const [bootstrap, setBootstrap] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    checkBootstrap().then((r) => setBootstrap(r.needed)).catch(() => {});
  }, [checkBootstrap]);

  useEffect(() => {
    if (user && profile) navigate({ to: "/", replace: true });
  }, [user, profile, navigate]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizeUsername(username) || !isValidPin(pin)) {
      toast.error("Informe o usuário e um PIN de 4 a 8 dígitos.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password: pinToPassword(pin),
    });
    if (error || !data.user) {
      setBusy(false);
      toast.error(
        error?.message?.toLowerCase().includes("banned")
          ? "Usuário inativo. Procure o administrador."
          : "Usuário ou PIN inválido.",
      );
      return;
    }
    const { data: p } = await supabase.from("profiles").select("status").eq("id", data.user.id).maybeSingle();
    if (!p || p.status !== "ATIVO") {
      await supabase.auth.signOut();
      setBusy(false);
      toast.error(p?.status === "PENDENTE" ? "Usuário pendente de liberação." : "Usuário inativo. Procure o administrador.");
      return;
    }
    setBusy(false);
  };

  const criarAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await doBootstrap({ data: { fullName, username, pin } });
      toast.success("Administrador criado. Entrando...");
      setBootstrap(false);
      await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password: pinToPassword(pin),
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-brand px-4">
      <form
        onSubmit={bootstrap ? criarAdmin : login}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-success text-success-foreground">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold">Controle de Recebimento</p>
            <p className="text-xs text-muted-foreground">CD Caieiras</p>
          </div>
        </div>

        {bootstrap && (
          <div className="flex gap-2 rounded-lg border border-border bg-muted p-3 text-xs">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
            Primeiro acesso: crie o Administrador do sistema. Depois disso, só administradores criam usuários.
          </div>
        )}

        {bootstrap && (
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome completo</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
        )}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Usuário</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="joao.silva"
            autoComplete="username"
            autoFocus
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">PIN</label>
          <Input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="••••"
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
          {bootstrap ? "Criar Administrador" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

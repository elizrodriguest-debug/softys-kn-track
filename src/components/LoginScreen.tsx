import { useState } from "react";
import { Delete, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandMarks } from "@/components/BrandMarks";
import type { Perfil } from "@/lib/types";

const PERFIL_LABEL: Record<Perfil, string> = {
  OPERADOR: "Operador",
  AUDITOR: "Auditor",
  ADMIN: "Administrador",
};

export function LoginScreen() {
  const { usuarios, login } = useStore();
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState(false);

  const digitar = (d: string) => {
    if (pin.length >= 4 || !selecionado) return;
    const novo = pin + d;
    setPin(novo);
    setErro(false);
    if (novo.length === 4) {
      setTimeout(() => {
        if (!login(selecionado, novo)) {
          setErro(true);
          setPin("");
        }
      }, 120);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-card shadow-soft">
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="border-b border-border p-6 sm:p-8 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <BrandMarks dark />
            </div>
            <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">
              Controle Operacional de Inbound
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione seu usuário e informe o PIN de 4 dígitos.
            </p>

            <div className="mt-6 space-y-2">
              {usuarios.map((u) => (
                <button
                  key={u.id}
                  disabled={!u.ativo}
                  onClick={() => {
                    setSelecionado(u.id);
                    setPin("");
                    setErro(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                    selecionado === u.id
                      ? "border-brand bg-accent"
                      : "border-border hover:bg-secondary",
                    !u.ativo && "cursor-not-allowed opacity-50",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{u.nome}</p>
                    <p className="text-xs text-muted-foreground">{PERFIL_LABEL[u.perfil]}</p>
                  </div>
                  {!u.ativo && <span className="text-xs text-danger">Inativo</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-center text-sm font-medium text-muted-foreground">
              {selecionado ? "Digite o PIN" : "Escolha um usuário para continuar"}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-12 w-10 rounded-xl border-2 text-center text-2xl leading-[2.75rem]",
                    erro ? "border-danger" : pin.length > i ? "border-brand" : "border-border",
                  )}
                >
                  {pin.length > i ? "•" : ""}
                </div>
              ))}
            </div>
            {erro && <p className="mt-3 text-center text-sm text-danger">PIN incorreto.</p>}

            <div className="mx-auto mt-6 grid max-w-[260px] grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  className="h-14 text-lg"
                  disabled={!selecionado}
                  onClick={() => digitar(d)}
                >
                  {d}
                </Button>
              ))}
              <div />
              <Button
                variant="outline"
                className="h-14 text-lg"
                disabled={!selecionado}
                onClick={() => digitar("0")}
              >
                0
              </Button>
              <Button
                variant="ghost"
                className="h-14"
                disabled={!selecionado}
                onClick={() => {
                  setPin((p) => p.slice(0, -1));
                  setErro(false);
                }}
              >
                <Delete className="h-5 w-5" />
              </Button>
            </div>

            <p className="mt-6 rounded-lg bg-secondary p-3 text-center text-xs text-muted-foreground">
              Demonstração — PINs: Operadores 1111 / 2222 · Auditor 3333 · Administrador 4444
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

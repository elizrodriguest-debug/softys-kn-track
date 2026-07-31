import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  History,
  LogOut,
  Menu,
  PackageCheck,
  ShieldCheck,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Perfil } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoginScreen } from "@/components/LoginScreen";
import { BrandMarks } from "@/components/BrandMarks";

const NAV: { to: string; label: string; icon: typeof Truck; perfis: Perfil[] }[] = [
  { to: "/", label: "Acompanhamento", icon: BarChart3, perfis: ["OPERADOR", "AUDITOR", "ADMIN"] },
  {
    to: "/recebimento-interno",
    label: "Receb. Interno",
    icon: Truck,
    perfis: ["OPERADOR", "AUDITOR", "ADMIN"],
  },
  {
    to: "/recebimento-externo",
    label: "Receb. Externo",
    icon: PackageCheck,
    perfis: ["OPERADOR", "AUDITOR", "ADMIN"],
  },
  {
    to: "/relatorio-mensal",
    label: "Relatório Mensal",
    icon: ClipboardList,
    perfis: ["AUDITOR", "ADMIN"],
  },
  {
    to: "/treinamento",
    label: "Treinamento",
    icon: BookOpen,
    perfis: ["OPERADOR", "AUDITOR", "ADMIN"],
  },
  { to: "/usuarios", label: "Usuários", icon: Users, perfis: ["ADMIN"] },
  { to: "/auditoria", label: "Histórico", icon: History, perfis: ["ADMIN"] },
];

const PERFIL_LABEL: Record<Perfil, string> = {
  OPERADOR: "Operador",
  AUDITOR: "Auditor",
  ADMIN: "Administrador",
};

export function AppShell({
  children,
  title,
  subtitle,
  perfis,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  perfis?: Perfil[];
}) {
  const { usuarioAtual, logout } = useStore();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!usuarioAtual) return <LoginScreen />;

  const permitido = !perfis || perfis.includes(usuarioAtual.perfil);
  const itens = NAV.filter((n) => n.perfis.includes(usuarioAtual.perfil));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-brand text-brand-foreground no-print">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success text-success-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold tracking-tight sm:text-base">
                Controle Operacional de Inbound
              </p>
              <p className="truncate text-[11px] text-brand-foreground/70">
                Recebimento Interno &amp; Externo
              </p>
            </div>
          </div>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <BrandMarks />
            <div className="h-8 w-px bg-brand-foreground/20" />
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">{usuarioAtual.nome}</p>
              <p className="text-[11px] text-brand-foreground/70">
                {PERFIL_LABEL[usuarioAtual.perfil]}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={logout}
              className="text-brand-foreground hover:bg-brand-foreground/10"
            >
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>

          <button
            className="ml-auto rounded-lg p-2 hover:bg-brand-foreground/10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="hidden border-t border-brand-foreground/10 lg:block">
          <div className="mx-auto flex max-w-[1600px] gap-1 px-4 sm:px-6">
            {itens.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === n.to
                    ? "border-success text-brand-foreground"
                    : "border-transparent text-brand-foreground/70 hover:text-brand-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </div>
        </nav>

        {open && (
          <div className="border-t border-brand-foreground/10 px-4 pb-4 lg:hidden">
            <div className="flex flex-col gap-1 py-2">
              {itens.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                    pathname === n.to
                      ? "bg-brand-foreground/15"
                      : "text-brand-foreground/80 hover:bg-brand-foreground/10",
                  )}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-brand-foreground/10 pt-3">
              <div>
                <p className="text-sm font-semibold">{usuarioAtual.nome}</p>
                <p className="text-[11px] text-brand-foreground/70">
                  {PERFIL_LABEL[usuarioAtual.perfil]}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={logout}
                className="text-brand-foreground hover:bg-brand-foreground/10"
              >
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {permitido ? (
          children
        ) : (
          <div className="card-surface p-10 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-semibold">Acesso restrito</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seu perfil ({PERFIL_LABEL[usuarioAtual.perfil]}) não possui permissão para este módulo.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

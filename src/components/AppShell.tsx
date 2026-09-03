import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { BarChart3, ClipboardList, FileSpreadsheet, Menu, Settings, Truck, UserCog, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { SHIFTS, type ShiftId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BrandMarks } from "@/components/BrandMarks";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const NAV = [
  { to: "/", label: "Acompanhamento", icon: BarChart3 },
  { to: "/registrar", label: "Registrar Descarga", icon: Truck },
  { to: "/historico", label: "Histórico / Consultas", icon: ClipboardList },
  { to: "/relatorio-mensal", label: "Relatório Mensal", icon: FileSpreadsheet },
  { to: "/configuracoes", label: "Configurações / Metas", icon: Settings },
] as const;

function SessionControl() {
  const { session, updateSession } = useStore();
  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2 rounded-lg border border-brand-foreground/20 px-3 py-1.5 text-left transition-colors hover:bg-brand-foreground/10">
        <UserCog className="h-4 w-4 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-tight">
            {session.operatorName}
          </span>
          <span className="block text-[11px] text-brand-foreground/70">
            Sessão ativa · {SHIFTS.find((s) => s.id === session.shiftId)?.label}
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div>
          <p className="text-sm font-semibold">Sessão ativa</p>
          <p className="text-xs text-muted-foreground">Operador e turno em operação.</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Operador</label>
          <Input
            value={session.operatorName}
            onChange={(e) => updateSession({ operatorName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Turno</label>
          <Select
            value={session.shiftId}
            onValueChange={(v) => updateSession({ shiftId: v as ShiftId })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHIFTS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label} ({s.range})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-brand text-brand-foreground no-print">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success text-success-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold tracking-tight sm:text-base">
                Controle e Fechamento de Recebimento
              </p>
              <p className="truncate text-[11px] text-brand-foreground/70">CD Caieiras</p>
            </div>
          </div>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <BrandMarks />
            <div className="h-8 w-px bg-brand-foreground/20" />
            <SessionControl />
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
            {NAV.map((n) => (
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
              {NAV.map((n) => (
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
            <div className="border-t border-brand-foreground/10 pt-3">
              <SessionControl />
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
        {children}
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, Target, Mail, UserCog } from "lucide-react";
import { toast } from "sonner";
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
import { useStore } from "@/lib/store";
import {
  DEFAULT_PALLETS_PER_VEHICLE,
  DIVISION_LABEL,
  DIVISION_OWNER,
  SHIFTS,
  type ShiftId,
} from "@/lib/types";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações e Metas | Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Defina metas por turno do recebimento interno e externo, destinatários do fechamento de turno e a sessão do operador.",
      },
      { property: "og:title", content: "Configurações e Metas | Softys × Kuehne+Nagel" },
      {
        property: "og:description",
        content: "Metas operacionais, destinatários de e-mail e sessão ativa do CD Caieiras.",
      },
    ],
  }),
  component: ConfiguracoesPage,
});

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Target;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ConfiguracoesPage() {
  const { settings, session, updateSettings, updateSession } = useStore();

  const [interno, setInterno] = useState(String(settings.goals.INTERNO));
  const [externo, setExterno] = useState(String(settings.goals.EXTERNO));
  const [emailTo, setEmailTo] = useState(settings.emailTo);
  const [emailCc, setEmailCc] = useState(settings.emailCc);
  const [operador, setOperador] = useState(session.operatorName);

  const salvarMetas = () => {
    updateSettings({
      goals: {
        INTERNO: Math.max(0, Number(interno) || 0),
        EXTERNO: Math.max(0, Number(externo) || 0),
      },
    });
    toast.success("Metas por turno atualizadas.");
  };

  const salvarEmail = () => {
    updateSettings({ emailTo, emailCc });
    toast.success("Destinatários do fechamento salvos.");
  };

  const salvarSessao = () => {
    updateSession({ operatorName: operador });
    toast.success("Sessão atualizada.");
  };

  return (
    <AppShell
      title="Configurações / Metas"
      subtitle="Parâmetros operacionais, destinatários do fechamento de turno e sessão ativa."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Section
          icon={Target}
          title="Metas operacionais por turno"
          description="Base do cálculo de atingimento no Acompanhamento e no Fechamento de Turno."
        >
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {DIVISION_LABEL.INTERNO} ({DIVISION_OWNER.INTERNO}) — veículos por turno
              </label>
              <Input
                type="number"
                min={0}
                value={interno}
                onChange={(e) => setInterno(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                {(Number(interno) || 0) * 3} veículos/dia (T1 + T2 + T3).
              </p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {DIVISION_LABEL.EXTERNO} ({DIVISION_OWNER.EXTERNO}) — veículos por turno
              </label>
              <Input
                type="number"
                min={0}
                value={externo}
                onChange={(e) => setExterno(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                {(Number(externo) || 0) * 3} veículos/dia (T1 + T2 + T3).
              </p>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
              Volume padrão por descarga interna: {DEFAULT_PALLETS_PER_VEHICLE} pallets/veículo.
            </div>
            <Button onClick={salvarMetas} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Salvar metas
            </Button>
          </div>
        </Section>

        <Section
          icon={Mail}
          title="Destinatários do Fechamento de Turno"
          description="Usados no e-mail de fechamento (Para e Cc), salvos no navegador."
        >
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Para</label>
              <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cc</label>
              <Input value={emailCc} onChange={(e) => setEmailCc(e.target.value)} />
            </div>
            <Button onClick={salvarEmail} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Salvar destinatários
            </Button>
          </div>
        </Section>

        <Section
          icon={UserCog}
          title="Sessão ativa"
          description="Operador e turno usados como autoria dos registros e do diário de bordo."
        >
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Operador</label>
              <Input value={operador} onChange={(e) => setOperador(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
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
            <Button onClick={salvarSessao} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Salvar sessão
            </Button>
          </div>
        </Section>

        <Section
          icon={Target}
          title="Turnos de trabalho"
          description="Faixas fixas usadas para identificar automaticamente o turno pelo horário."
        >
          <ul className="divide-y divide-border text-sm">
            {SHIFTS.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5">
                <span className="font-medium text-foreground">{s.label}</span>
                <span className="tabular-nums text-muted-foreground">{s.range}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </AppShell>
  );
}

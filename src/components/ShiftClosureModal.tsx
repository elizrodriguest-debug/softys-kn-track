import { useMemo, useState } from "react";
import { Check, Copy, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { computeKpis } from "@/lib/analytics";
import {
  DIVISION_LABEL,
  DIVISION_OWNER,
  EXTERNAL_OPERATIONS,
  FACTORIES,
  formatDateBR,
  isConforme,
  nonConformities,
  recordVolumes,
  type DischargeRecord,
  type DivisionType,
  type ShiftId,
} from "@/lib/types";

export function ShiftClosureModal({
  open,
  onOpenChange,
  division,
  shiftId,
  date,
  records,
  goal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  division: DivisionType;
  shiftId: ShiftId;
  date: string;
  records: DischargeRecord[];
  goal: number;
}) {
  const { settings, updateSettings, getLogbook, saveLogbook, session } = useStore();
  const [copied, setCopied] = useState(false);
  const [notesDraft, setNotesDraft] = useState<string | null>(null);

  const kpis = useMemo(() => computeKpis(records, goal), [records, goal]);
  const goalOk = kpis.attainment >= 100;
  const logEntry = getLogbook(date, shiftId);
  const notes = notesDraft ?? logEntry?.notes ?? "";

  const distribution = useMemo(() => {
    const keys = division === "INTERNO" ? FACTORIES : EXTERNAL_OPERATIONS;
    return keys.map((k) => ({
      key: k,
      count: records.filter((r) =>
        division === "INTERNO" ? r.factoryType === k : r.operationType === k,
      ).length,
    }));
  }, [records, division]);

  const ocorrencias = useMemo(
    () =>
      records
        .filter((r) => !isConforme(r))
        .map((r) => ({ record: r, items: nonConformities(r) })),
    [records],
  );

  const subject = `[Fechamento de Turno] ${DIVISION_OWNER[division]} | ${shiftId} | ${formatDateBR(
    date,
  )} | ${goalOk ? "META ATINGIDA" : "ABAIXO DA META"}`;

  const body = useMemo(() => {
    const linhas: string[] = [];
    linhas.push(`FECHAMENTO DE TURNO - ${DIVISION_LABEL[division]} (${DIVISION_OWNER[division]})`);
    linhas.push(`Data: ${formatDateBR(date)}  |  Turno: ${shiftId}  |  Operador: ${session.operatorName}`);
    linhas.push("");
    linhas.push("1) REALIZACAO E PRODUTIVIDADE");
    linhas.push(`- Veiculos descarregados: ${kpis.vehicles}`);
    linhas.push(`- Meta do turno: ${goal}`);
    linhas.push(`- Atingimento: ${kpis.attainment}% (${goalOk ? "META ATINGIDA" : "ABAIXO DA META"})`);
    linhas.push(`- Volumes recebidos: ${kpis.volumes.toLocaleString("pt-BR")}`);
    linhas.push(`- Conformidade: ${kpis.conformityRate}% (${kpis.nonConformes} com nao-conformidade)`);
    linhas.push(
      `- Distribuicao: ${distribution.map((d) => `${d.key}: ${d.count}`).join("  |  ")}`,
    );
    linhas.push("");
    linhas.push("2) DIARIO DE BORDO E JUSTIFICATIVAS");
    linhas.push(notes.trim() ? notes.trim() : "Sem apontamentos registrados para o turno.");
    linhas.push("");
    linhas.push("3) OCORRENCIAS E NAO-CONFORMIDADES");
    if (ocorrencias.length === 0) {
      linhas.push("100% Conforme - nenhuma ocorrencia registrada.");
    } else {
      for (const o of ocorrencias) {
        const id =
          o.record.division === "INTERNO"
            ? o.record.asnNumber || "SEM ASN"
            : o.record.invoiceNumber || "SEM NF";
        linhas.push(
          `- ${o.record.time} | Placa ${o.record.licensePlate ?? "-"} | ${id} | ${o.items
            .map((i) => `${i.label}${i.quantity ? ` (${i.quantity})` : ""}${i.detail ? ` - ${i.detail}` : ""}`)
            .join("; ")}`,
        );
      }
    }
    linhas.push("");
    linhas.push("Softys x Kuehne+Nagel - CD Caieiras");
    return linhas.join("\n");
  }, [division, date, shiftId, session.operatorName, kpis, goal, goalOk, distribution, notes, ocorrencias]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      /* ignore */
    }
    setCopied(true);
    toast.success("Texto do e-mail copiado.");
    setTimeout(() => setCopied(false), 2000);
  };

  const gmail = () => {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      settings.emailTo,
    )}&cc=${encodeURIComponent(settings.emailCc)}&su=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener");
  };

  const mailto = () => {
    window.location.href = `mailto:${encodeURIComponent(settings.emailTo)}?cc=${encodeURIComponent(
      settings.emailCc,
    )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand" /> Fechamento de Turno
          </DialogTitle>
          <DialogDescription>
            {DIVISION_LABEL[division]} · {formatDateBR(date)} · Turno {shiftId}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="painel">
          <TabsList className="w-full">
            <TabsTrigger value="painel" className="flex-1">Painel Visual</TabsTrigger>
            <TabsTrigger value="texto" className="flex-1">Texto do E-mail</TabsTrigger>
            <TabsTrigger value="dest" className="flex-1">Destinatários &amp; Assunto</TabsTrigger>
          </TabsList>

          {/* Aba 1 */}
          <TabsContent value="painel" className="space-y-4">
            <section className="rounded-xl border border-border p-4">
              <h4 className="font-display text-sm font-bold">1. Realização e Produtividade</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Veículos descarregados" value={String(kpis.vehicles)} />
                <Metric label="Meta do turno" value={String(goal)} />
                <Metric label="Atingimento" value={`${kpis.attainment}%`} />
                <Metric label="Volumes recebidos" value={kpis.volumes.toLocaleString("pt-BR")} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className={goalOk ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                  {goalOk ? "Meta Atingida" : "Abaixo da Meta"}
                </Badge>
                <Badge variant="outline">Conformidade {kpis.conformityRate}%</Badge>
                {distribution.map((d) => (
                  <Badge key={d.key} variant="secondary">
                    {d.key}: {d.count}
                  </Badge>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-border p-4">
              <h4 className="font-display text-sm font-bold">2. Diário de Bordo e Justificativas</h4>
              <Textarea
                className="mt-3 min-h-24"
                value={notes}
                placeholder="Justificativas operacionais do turno..."
                onChange={(e) => {
                  setNotesDraft(e.target.value);
                  saveLogbook(date, shiftId, e.target.value);
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                As alterações são salvas automaticamente e refletidas no texto do e-mail.
              </p>
            </section>

            <section className="rounded-xl border border-border p-4">
              <h4 className="font-display text-sm font-bold">3. Ocorrências e Não-Conformidades</h4>
              {ocorrencias.length === 0 ? (
                <Badge className="mt-3 bg-success text-success-foreground">100% Conforme</Badge>
              ) : (
                <div className="mt-3 space-y-2">
                  {ocorrencias.map((o) => (
                    <div key={o.record.id} className="rounded-lg bg-secondary/60 p-3 text-sm">
                      <p className="font-semibold">
                        {o.record.time} · Placa {o.record.licensePlate ?? "-"} ·{" "}
                        {o.record.division === "INTERNO"
                          ? o.record.asnNumber || "Sem ASN"
                          : o.record.invoiceNumber || "Sem NF"}{" "}
                        · {o.record.carrierName}
                      </p>
                      <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                        {o.items.map((i, idx) => (
                          <li key={idx}>
                            <span className="font-medium text-foreground">{i.label}</span>
                            {i.quantity ? ` — ${i.quantity}` : ""} {i.detail ? `— ${i.detail}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          {/* Aba 2 */}
          <TabsContent value="texto" className="space-y-3">
            <pre className="max-h-[45vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-secondary/50 p-4 text-xs leading-relaxed">
              {body}
            </pre>
            <Button variant="outline" onClick={copy}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar Texto"}
            </Button>
          </TabsContent>

          {/* Aba 3 */}
          <TabsContent value="dest" className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Para</label>
              <Input
                value={settings.emailTo}
                onChange={(e) => updateSettings({ emailTo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cc</label>
              <Input
                value={settings.emailCc}
                onChange={(e) => updateSettings({ emailCc: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Assunto (gerado dinamicamente)
              </label>
              <Input value={subject} readOnly className="bg-secondary/60" />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button variant="outline" onClick={copy}>
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />} Copiar Texto
          </Button>
          <Button variant="outline" onClick={gmail}>
            <Mail className="h-4 w-4" /> Gmail Web
          </Button>
          <Button onClick={mailto}>
            <Send className="h-4 w-4" /> Enviar Fechamento de Turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export { recordVolumes };

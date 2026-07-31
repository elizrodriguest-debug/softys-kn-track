import { Badge } from "@/components/ui/badge";
import { anomaliasDoRegistro, type Registro } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHIP =
  "rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight whitespace-nowrap";

export function OcorrenciaBadges({ registro: r }: { registro: Registro }) {
  if (anomaliasDoRegistro(r) === 0) {
    return (
      <span className={cn(CHIP, "bg-success/15 text-success-foreground")}>Conforme</span>
    );
  }
  const itens: { label: string; tone: "warn" | "crit" }[] = [];
  if (r.semAsn) itens.push({ label: "Sem ASN", tone: "crit" });
  if (r.palletsQuebrados) itens.push({ label: `${r.palletsQuebrados} quebrado(s)`, tone: "crit" });
  if (r.palletsTombados) itens.push({ label: `${r.palletsTombados} tombado(s)`, tone: "warn" });
  if (r.ilpnAusentes) itens.push({ label: `${r.ilpnAusentes} iLPN ausente`, tone: "warn" });
  if (r.ilpnInvalidas) itens.push({ label: `${r.ilpnInvalidas} iLPN inválida`, tone: "warn" });
  if (r.divergenciaCaixas) itens.push({ label: `Div. ${r.divergenciaCaixas} cx`, tone: "crit" });
  if (r.produtosAvariados) itens.push({ label: `${r.produtosAvariados} avariado(s)`, tone: "crit" });
  if (r.etiquetaNaoConforme) itens.push({ label: "Etiqueta fora do padrão", tone: "warn" });

  return (
    <div className="flex flex-wrap gap-1">
      {itens.map((i) => (
        <span
          key={i.label}
          className={cn(
            CHIP,
            i.tone === "crit" ? "bg-danger/12 text-danger" : "bg-warning/20 text-warning-foreground",
          )}
        >
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function StatusBadge({ conforme }: { conforme: boolean }) {
  return (
    <Badge variant={conforme ? "secondary" : "destructive"}>
      {conforme ? "Conforme" : "Com ocorrência"}
    </Badge>
  );
}

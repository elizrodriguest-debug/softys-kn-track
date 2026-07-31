import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RecebimentoPage } from "@/components/RecebimentoPage";

export const Route = createFileRoute("/recebimento-interno")({
  head: () => ({
    meta: [
      { title: "Recebimento Interno | Inbound Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Registro e acompanhamento das descargas de transferências entre fábricas das divisões Tissue e Personal.",
      },
      { property: "og:title", content: "Recebimento Interno | Inbound Softys × Kuehne+Nagel" },
      {
        property: "og:description",
        content: "Controle de ASN, iLPN e anomalias em pallets nas transferências internas.",
      },
    ],
  }),
  component: () => (
    <AppShell
      title="Recebimento Interno"
      subtitle="Transferências entre fábricas e filiais — divisões Tissue e Personal."
    >
      <RecebimentoPage tipo="INTERNO" />
    </AppShell>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RecebimentoPage } from "@/components/RecebimentoPage";

export const Route = createFileRoute("/recebimento-externo")({
  head: () => ({
    meta: [
      { title: "Recebimento Externo | Inbound Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Controle de notas fiscais, divergências físicas x faturadas e avarias em cargas de fornecedores terceiros.",
      },
      { property: "og:title", content: "Recebimento Externo | Inbound Softys × Kuehne+Nagel" },
      {
        property: "og:description",
        content: "Conformidade de etiqueta padrão Softys e divergências fiscais de fornecedores.",
      },
    ],
  }),
  component: () => (
    <AppShell
      title="Recebimento Externo"
      subtitle="Cargas de fornecedores terceiros — nota fiscal, divergências e avarias."
    >
      <RecebimentoPage tipo="EXTERNO" />
    </AppShell>
  ),
});

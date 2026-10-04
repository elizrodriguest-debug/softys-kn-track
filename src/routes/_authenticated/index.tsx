import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Acompanhamento Inbound | Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Dashboard operacional de descargas por turno, metas, anomalias e diário de bordo do recebimento inbound.",
      },
      { property: "og:title", content: "Acompanhamento Inbound | Softys × Kuehne+Nagel" },
      {
        property: "og:description",
        content: "Metas por turno, indicadores de conformidade e ocorrências em tempo real.",
      },
    ],
  }),
  component: () => (
    <AppShell
      title="Acompanhamento"
      subtitle="Desempenho das descargas por turno, metas e ocorrências operacionais."
    >
      <Dashboard />
    </AppShell>
  ),
});

import { createFileRoute } from "@tanstack/react-router";

import { AffiliateDashboardPage } from "@/components/affiliate/AffiliateDashboardPage";

export const Route = createFileRoute("/afiliados")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel de afiliados — CifraStop" },
      {
        name: "description",
        content:
          "Acompanhe cliques, comissões e saldo do programa de afiliados do CifraStop e solicite seu saque via PIX.",
      },
      { property: "og:title", content: "Painel de afiliados — CifraStop" },
      {
        property: "og:description",
        content: "Indique músicos, ganhe 100% no primeiro mês e 30% recorrente com o CifraStop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AffiliateDashboardPage,
});

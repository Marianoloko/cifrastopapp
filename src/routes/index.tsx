import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  // Sem página de vendas: quem entra vai direto para o app (degustação livre).
  beforeLoad: () => {
    throw redirect({ to: "/app", replace: true });
  },
  head: () => ({
    meta: [
      { title: "CifraStop — Kit completo do músico no celular" },
      {
        name: "description",
        content:
          "Repertório de cifras na nuvem, retorno de áudio, afinador, metrônomo e gravador no seu celular.",
      },
      { property: "og:title", content: "CifraStop — Kit completo do músico no celular" },
      {
        property: "og:description",
        content:
          "Repertório de cifras na nuvem, retorno de áudio, afinador, metrônomo e gravador no seu celular.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});

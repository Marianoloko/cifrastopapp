import { Link, createFileRoute } from "@tanstack/react-router";
import { Headphones, ListMusic, Mic, Music2, Timer } from "lucide-react";

import { PlanGrid, usePlans } from "@/components/PlanGrid";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CifraStop — Kit completo do músico no celular" },
      {
        name: "description",
        content:
          "Repertório de cifras na nuvem, retorno de áudio, afinador, metrônomo e gravador. Teste grátis por 4 horas.",
      },
      { property: "og:title", content: "CifraStop — Kit completo do músico no celular" },
      {
        property: "og:description",
        content:
          "Repertório de cifras na nuvem, retorno de áudio, afinador, metrônomo e gravador. Teste grátis por 4 horas.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: ListMusic, title: "Repertório na nuvem", text: "Suas cifras em qualquer aparelho." },
  { icon: Headphones, title: "Retorno ao vivo", text: "Microfone com reverb e delay em tempo real." },
  { icon: Music2, title: "Afinador cromático", text: "Precisão em cents, direto no navegador." },
  { icon: Timer, title: "Metrônomo", text: "40 a 240 BPM com tap tempo e compassos." },
  { icon: Mic, title: "Gravador de ensaio", text: "Grave, ouça e baixe o áudio na hora." },
];

function Index() {
  const { data: plans = [] } = usePlans();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-4">
        <span className="text-lg font-extrabold tracking-tight text-foreground">CifraStop</span>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main>
        <section className="px-4 pb-10 pt-6 text-center">
          <h1 className="text-3xl font-extrabold leading-tight text-foreground md:text-5xl">
            CifraVocal Pro — Kit completo do músico
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Repertório sincronizado na nuvem, retorno de áudio ao vivo, afinador, metrônomo e
            gravador. Tudo no seu celular, pronto para o palco e o ensaio.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/auth">Criar Conta e Testar Grátis por 4 Horas</Link>
          </Button>
        </section>

        <section className="px-4 py-8">
          <h2 className="text-center text-xl font-bold text-foreground">Recursos</h2>
          <div className="mx-auto mt-6 grid max-w-4xl gap-3 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="rounded-xl border bg-card p-4">
                <feature.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-2 text-sm font-bold text-card-foreground">{feature.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 py-8">
          <h2 className="text-center text-xl font-bold text-foreground">Planos</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Assine diretamente pelo WhatsApp e libere seu acesso instantaneamente.
          </p>
          <div className="mx-auto mt-6 max-w-5xl">
            <PlanGrid plans={plans} />
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        Feito para músicos · Sincronizado na nuvem
      </footer>
    </div>
  );
}

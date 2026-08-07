import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";

type Guide = {
  id: string;
  title: string;
  goal: string;
  routine: string[];
  tips: string[];
};

const GUIDES: Guide[] = [
  {
    id: "iniciante",
    title: "Iniciante — primeiros 30 dias",
    goal: "Tocar 3 músicas completas com troca de acordes limpa.",
    routine: [
      "5 min: afinar o instrumento e alongar as mãos",
      "10 min: acordes maiores (C, G, D, A, E) trocando a cada 2 tempos",
      "10 min: batida simples com metrônomo em 60 BPM",
      "5 min: tocar uma música do repertório do começo ao fim",
    ],
    tips: [
      "Aumente o metrônomo só quando errar zero trocas por 3 repetições.",
      "Grave 1 minuto por dia no Gravador e compare no fim da semana.",
    ],
  },
  {
    id: "cantor",
    title: "Cantor — voz e afinação",
    goal: "Cantar no seu tom sem forçar a voz.",
    routine: [
      "5 min: respiração diafragmática (4s inspira, 8s expira)",
      "10 min: vocalize de sirene e escalas subindo meio tom",
      "10 min: cantar a música com a cifra transposta para o seu tom",
      "5 min: usar o Retorno com preset de voz e ouvir a própria afinação",
    ],
    tips: [
      "Use o botão de transposição e salve o tom favorito da música.",
      "Nunca ensaie mais de 40 min sem descanso vocal.",
    ],
  },
  {
    id: "instrumentista",
    title: "Instrumentista — precisão e ritmo",
    goal: "Tocar no tempo, sem atropelar as viradas.",
    routine: [
      "5 min: aquecimento cromático casa por casa",
      "10 min: escala do tom da música com metrônomo",
      "10 min: levada da música em 3 velocidades (80%, 100%, 110%)",
      "5 min: tocar junto ao Player de Mídia da cifra",
    ],
    tips: [
      "Use o controle de velocidade do player para estudar trechos difíceis.",
      "Toque de olhos fechados uma vez por dia para soltar a memória muscular.",
    ],
  },
  {
    id: "banda",
    title: "Banda — ensaio produtivo",
    goal: "Ensaiar 6 músicas em 90 minutos sem bagunça.",
    routine: [
      "10 min: afinação geral e ajuste de retorno",
      "40 min: 6 músicas do setlist, uma passada cada",
      "30 min: repetir só as passagens problemáticas",
      "10 min: passar a ordem final do setlist",
    ],
    tips: [
      "Monte o setlist em uma pasta e exporte o PDF para todo mundo.",
      "Use o Modo Banda para todos abrirem a mesma cifra ao mesmo tempo.",
    ],
  },
];

export function GuiaEstudo() {
  const [openId, setOpenId] = useState<string | null>(GUIDES[0].id);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
        <BookOpen className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-card-foreground">Guia de Estudo</p>
          <p className="text-xs text-muted-foreground">
            Rotinas prontas, sem IA: escolha seu perfil e siga o passo a passo.
          </p>
        </div>
      </div>

      {GUIDES.map((guide) => (
        <div key={guide.id} className="rounded-xl border bg-card">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 p-3 text-left"
            onClick={() => setOpenId(openId === guide.id ? null : guide.id)}
          >
            <span className="text-sm font-semibold text-card-foreground">{guide.title}</span>
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                openId === guide.id ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
          {openId === guide.id ? (
            <div className="space-y-2 border-t p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Objetivo</p>
              <p className="text-foreground">{guide.goal}</p>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Rotina diária</p>
              <ul className="list-disc space-y-1 pl-5 text-foreground">
                {guide.routine.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Dicas</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {guide.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
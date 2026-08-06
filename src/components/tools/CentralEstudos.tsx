import { useState } from "react";
import { ExternalLink, GraduationCap, Guitar, Mic2, Music4, Piano } from "lucide-react";

import { Vocalize } from "@/components/tools/Vocalize";
import { PlanoEstudoIA } from "@/components/tools/PlanoEstudoIA";
import { cn } from "@/lib/utils";

type Lesson = { title: string; description: string; search: string };

type Course = {
  id: string;
  label: string;
  icon: typeof Piano;
  intro: string;
  drills: string[];
  lessons: Lesson[];
};

const COURSES: Course[] = [
  {
    id: "piano",
    label: "Piano / Teclado",
    icon: Piano,
    intro: "Rotina de independência de mãos, digitação e leitura de cifra no teclado.",
    drills: [
      "5 min: escala de Dó maior com mão direita, digitação 1-2-3-1-2-3-4-5.",
      "5 min: mão esquerda tocando a fundamental enquanto a direita faz o acorde.",
      "5 min: troca C - Am - F - G em levada de 4 tempos, sem parar o pulso.",
      "5 min: arpejos quebrados (1-3-5-3) subindo por todos os tons.",
    ],
    lessons: [
      { title: "Independência de mãos", description: "Exercício progressivo para separar ritmo e melodia", search: "exercicio independencia de maos teclado iniciante" },
      { title: "Digitação correta", description: "Como posicionar os dedos nas escalas maiores", search: "digitacao escalas piano aula" },
      { title: "Acompanhamento com cifra", description: "Tocar qualquer música lendo só a cifra", search: "como tocar teclado lendo cifra acompanhamento" },
    ],
  },
  {
    id: "violao",
    label: "Violão / Guitarra",
    icon: Guitar,
    intro: "Troca rápida de acordes, ritmos brasileiros e limpeza de som.",
    drills: [
      "3 min: troca G - C em 60 BPM, uma batida por acorde.",
      "5 min: acordes com pestana F e Bm, 4 tempos cada, sem pressa.",
      "5 min: levada de xote e balada com o metrônomo em 80 BPM.",
      "5 min: exercício cromático 1-2-3-4 casa por casa para aquecer.",
    ],
    lessons: [
      { title: "Troca rápida de acordes", description: "Método dos dedos-guia para não travar", search: "exercicio troca rapida de acordes violao" },
      { title: "Ritmos essenciais", description: "Balada, xote, sertanejo e pop", search: "ritmos de violao basicos aula" },
      { title: "Pestana sem dor", description: "Postura de polegar e força correta", search: "como fazer pestana no violao aula" },
    ],
  },
  {
    id: "canto",
    label: "Canto / Técnica Vocal",
    icon: Mic2,
    intro: "Aquecimento, respiração e afinação com o vocalize guiado do app.",
    drills: [
      "Respiração diafragmática: 4 tempos inspirando, 8 soltando.",
      "Vibração de lábios subindo e descendo a escala.",
      "Sirene em 'ni' para conectar grave e agudo.",
      "Desaquecimento em hum grave ao final de todo ensaio.",
    ],
    lessons: [
      { title: "Apoio e respiração", description: "Sustentar notas longas sem perder o ar", search: "aula respiracao diafragmatica canto" },
      { title: "Afinação e ouvido", description: "Treinar a percepção de altura das notas", search: "exercicio afinacao vocal treino de ouvido" },
      { title: "Mistura de registros", description: "Passar do peito para a cabeça sem quebrar", search: "voz mista aula canto" },
    ],
  },
  {
    id: "baixo",
    label: "Baixo",
    icon: Music4,
    intro: "Condução, groove e técnica de slap com foco em tempo firme.",
    drills: [
      "5 min: fundamental e quinta acompanhando o metrônomo em 80 BPM.",
      "5 min: caminhada (walking) sobre C - Am - F - G.",
      "5 min: slap com polegar no Mi e pull-off no Sol.",
      "5 min: exercício cromático 1-2-3-4 para digitação.",
    ],
    lessons: [
      { title: "Condução e groove", description: "Como travar o tempo com a bateria", search: "aula de baixo groove conducao iniciante" },
      { title: "Técnica de slap", description: "Polegar, pull e mute de cordas", search: "aula slap baixo iniciante" },
      { title: "Digitação e escalas", description: "Escalas maiores e menores no braço", search: "exercicio digitacao baixo escalas" },
    ],
  },
];

export function CentralEstudos() {
  const [courseId, setCourseId] = useState(COURSES[0].id);
  const course = COURSES.find((item) => item.id === courseId) ?? COURSES[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-amber-soft p-3 text-accent-foreground">
        <GraduationCap className="size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold">Central de Estudos</p>
          <p className="text-xs">Escola CifraStop: rotinas curtas e aulas por instrumento.</p>
        </div>
      </div>

      <PlanoEstudoIA />

      <div className="grid grid-cols-2 gap-2">
        {COURSES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCourseId(item.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition-colors",
              item.id === courseId
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{course.intro}</p>

      {course.id === "canto" ? <Vocalize /> : null}

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <p className="text-sm font-bold text-foreground">Rotina prática de 20 minutos</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {course.drills.map((drill) => (
            <li key={drill} className="flex gap-2">
              <span className="text-primary">•</span>
              {drill}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Aulas em vídeo</p>
        {course.lessons.map((lesson) => (
          <a
            key={lesson.title}
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.search)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{lesson.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{lesson.description}</span>
            </span>
            <ExternalLink className="size-4 shrink-0 text-primary" aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

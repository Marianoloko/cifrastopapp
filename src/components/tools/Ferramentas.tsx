import { useState } from "react";
import { ChevronLeft, Drum, Headphones, Mic, Music2, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Acompanhamento } from "@/components/tools/Acompanhamento";
import { Afinador } from "@/components/tools/Afinador";
import { Gravador } from "@/components/tools/Gravador";
import { Metronomo } from "@/components/tools/Metronomo";
import { Retorno } from "@/components/tools/Retorno";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToolId = "retorno" | "afinador" | "metronomo" | "gravador" | "acompanhamento";

const TOOLS: { id: ToolId; label: string; description: string; icon: LucideIcon }[] = [
  { id: "retorno", label: "Retorno de Áudio", description: "Sua voz no fone, com reverb e delay.", icon: Headphones },
  { id: "afinador", label: "Afinador", description: "Cromático e corda a corda.", icon: Music2 },
  { id: "metronomo", label: "Metrônomo", description: "BPM, compasso e pulso visual.", icon: Timer },
  { id: "gravador", label: "Gravador", description: "Grave o ensaio e escute depois.", icon: Mic },
  { id: "acompanhamento", label: "Acompanhamento", description: "Base rítmica para treinar.", icon: Drum },
];

/**
 * Todas as ferramentas ficam montadas e apenas escondidas, para que o áudio
 * continue tocando quando o músico troca de ferramenta ou de aba.
 */
export function Ferramentas() {
  const [open, setOpen] = useState<ToolId | null>(null);
  const active = TOOLS.find((tool) => tool.id === open) ?? null;

  return (
    <div className="space-y-4">
      {active ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(null)}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Ferramentas
          </Button>
          <h2 className="truncate text-base font-bold text-foreground">{active.label}</h2>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setOpen(tool.id)}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
                <tool.icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-card-foreground">{tool.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{tool.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {TOOLS.map((tool) => (
        <div key={tool.id} className={cn(open === tool.id ? "block" : "hidden")}>
          {tool.id === "retorno" ? <Retorno /> : null}
          {tool.id === "afinador" ? <Afinador /> : null}
          {tool.id === "metronomo" ? <Metronomo /> : null}
          {tool.id === "gravador" ? <Gravador /> : null}
          {tool.id === "acompanhamento" ? <Acompanhamento /> : null}
        </div>
      ))}
    </div>
  );
}
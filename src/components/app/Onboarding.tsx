import { useEffect, useState } from "react";
import { ChevronRight, Music2, Rocket, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const KEY = "cifrastop:onboarding-v1";

const STEPS = [
  {
    icon: Music2,
    title: "Seu repertório na nuvem",
    text: "Salve cifras, mude o tom com um toque, use a rolagem automática e o Modo Palco para ler no escuro.",
  },
  {
    icon: SlidersHorizontal,
    title: "Ferramentas de áudio",
    text: "Retorno de voz no fone, afinador cromático, metrônomo e gravador — tudo sem mesa de som.",
  },
  {
    icon: Rocket,
    title: "IA que divulga você",
    text: "Na aba Perfil, gere roteiros de vídeo, hashtags e legendas prontas para o seu estilo musical.",
  },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.localStorage.getItem(KEY) !== "done") setOpen(true);
  }, []);

  const finish = () => {
    window.localStorage.setItem(KEY, "done");
    setOpen(false);
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : finish())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10">
            <Icon className="size-6 text-primary" aria-hidden="true" />
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.text}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1.5 py-2">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === step ? "w-6 bg-primary" : "w-1.5 bg-muted",
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={finish}>
            Pular
          </Button>
          <Button
            className="flex-1"
            onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
          >
            {step === STEPS.length - 1 ? "Começar" : "Próximo"}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { Clock } from "lucide-react";

import { formatRemaining } from "@/lib/access";

export function TrialBanner({
  remainingMs,
  onSubscribe,
}: {
  remainingMs: number;
  onSubscribe: () => void;
}) {
  return (
    <div className="sticky top-0 z-40 flex h-9 items-center justify-between gap-2 bg-tom px-3 text-primary-foreground">
      <div className="flex items-center gap-2 text-xs font-medium">
        <Clock className="size-3.5" aria-hidden="true" />
        <span>Teste grátis</span>
        <span aria-hidden="true">•</span>
        <span className="font-mono tabular-nums">{formatRemaining(remainingMs)} restantes</span>
      </div>
      <button
        onClick={onSubscribe}
        className="rounded-full bg-background/20 px-3 py-1 text-[11px] font-semibold transition-colors hover:bg-background/30"
      >
        Assinar R$ 15/mês
      </button>
    </div>
  );
}
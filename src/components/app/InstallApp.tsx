import { useEffect, useState } from "react";
import { Download, Share, Plus, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

export function InstallApp() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = () => {
    if (deferred) {
      void deferred.prompt();
      setDeferred(null);
      return;
    }
    setIosOpen(true);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={install} aria-label="Instalar app no celular">
        <Download className="size-4 text-primary" aria-hidden="true" />
        <span className="hidden sm:inline">Instalar App</span>
      </Button>

      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent className="max-w-[20rem] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">📲 Instalar no iPhone</DialogTitle>
            <DialogDescription>Três passos rápidos no Safari:</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <Share className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>1. Toque no botão Compartilhar (quadrado com seta).</span>
            </li>
            <li className="flex items-start gap-3">
              <Plus className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>2. Escolha “Adicionar à Tela de Início”.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>3. Confirme em “Adicionar”. Pronto!</span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}

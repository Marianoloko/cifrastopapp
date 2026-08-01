import { useState } from "react";
import { Mail, MessageSquareWarning, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { openWhatsApp } from "@/lib/access";

const SUGGESTIONS_EMAIL = "CifrasTopApp@gmail.com";

export function Suporte() {
  const [reclamacao, setReclamacao] = useState("");
  const [sugestao, setSugestao] = useState("");

  const enviarReclamacao = () => {
    const texto = reclamacao.trim();
    if (!texto) {
      toast.error("Escreva sua reclamação antes de enviar.");
      return;
    }
    openWhatsApp(`Reclamação (CifraStop): ${texto}`);
  };

  const enviarSugestao = () => {
    const texto = sugestao.trim();
    if (!texto) {
      toast.error("Escreva sua sugestão antes de enviar.");
      return;
    }
    const link = `mailto:${SUGGESTIONS_EMAIL}?subject=${encodeURIComponent(
      "Sugestão — CifraStop",
    )}&body=${encodeURIComponent(texto)}`;
    window.location.href = link;
  };

  return (
    <div className="space-y-4 py-4">
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareWarning className="size-5 text-destructive" aria-hidden="true" />
            Reclamação em tempo real
          </CardTitle>
          <CardDescription>
            Conte o que aconteceu e fale direto com o suporte pelo WhatsApp, na hora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={reclamacao}
            onChange={(event) => setReclamacao(event.target.value)}
            placeholder="Descreva o problema…"
            rows={4}
          />
          <Button className="w-full" onClick={enviarReclamacao}>
            <Send className="size-4" aria-hidden="true" />
            Enviar reclamação no WhatsApp
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-5 text-primary" aria-hidden="true" />
            Sugestões
          </CardTitle>
          <CardDescription>
            Tem uma ideia para o app? Envie para {SUGGESTIONS_EMAIL}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={sugestao}
            onChange={(event) => setSugestao(event.target.value)}
            placeholder="Escreva sua sugestão…"
            rows={4}
          />
          <Button variant="outline" className="w-full" onClick={enviarSugestao}>
            <Mail className="size-4" aria-hidden="true" />
            Enviar sugestão por e-mail
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
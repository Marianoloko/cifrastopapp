import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Hash, Loader2, Rocket, Sparkles, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gerarEstrategia, type MarketingStrategy } from "@/lib/marketing.functions";

const ESTILOS = ["Gospel", "Sertanejo", "MPB", "Rock", "Pagode", "Worship", "Pop", "Forró"];

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  } catch {
    toast.error("Não consegui copiar. Selecione e copie manualmente.");
  }
}

export function ImpulsionarIA() {
  const gerar = useServerFn(gerarEstrategia);
  const [tiktok, setTiktok] = useState("");
  const [instagram, setInstagram] = useState("");
  const [estilo, setEstilo] = useState("Gospel");
  const [result, setResult] = useState<MarketingStrategy | null>(null);

  const mutation = useMutation({
    mutationFn: () => gerar({ data: { tiktok, instagram, estilo } }),
    onSuccess: (data) => setResult(data),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Não consegui gerar a estratégia."),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <Rocket className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-card-foreground">Impulsionar com IA</h3>
            <p className="text-xs text-muted-foreground">
              Sua estratégia de conteúdo musical do dia, pronta para gravar e postar.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="tiktok">@ do TikTok</Label>
            <Input
              id="tiktok"
              value={tiktok}
              placeholder="@seuperfil"
              onChange={(event) => setTiktok(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="instagram">@ do Instagram</Label>
            <Input
              id="instagram"
              value={instagram}
              placeholder="@seuperfil"
              onChange={(event) => setInstagram(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Estilo musical</Label>
          <div className="flex flex-wrap gap-2">
            {ESTILOS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEstilo(item)}
                className={
                  item === estilo
                    ? "rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground"
                    : "rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
                }
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <Button
          className="h-12 w-full text-base font-bold"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-5" aria-hidden="true" />
          )}
          Gerar Estratégia de Hoje
        </Button>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">Diagnóstico</p>
            <p className="text-sm leading-relaxed text-card-foreground">{result.diagnostico}</p>
            {result.tendencias.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {result.tendencias.map((item) => (
                  <li key={item} className="text-xs text-muted-foreground">
                    • {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {result.videos.map((video, index) => (
            <div key={video.titulo} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <Video className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="min-w-0 flex-1 text-sm font-bold text-card-foreground">
                  Vídeo {index + 1}: {video.titulo}
                </p>
              </div>
              <p className="mt-2 rounded-lg bg-muted p-2 text-xs font-medium text-foreground">
                Gancho: {video.gancho}
              </p>
              <ol className="mt-2 space-y-1">
                {video.roteiro.map((step, stepIndex) => (
                  <li key={step} className="text-xs text-muted-foreground">
                    {stepIndex + 1}. {step}
                  </li>
                ))}
              </ol>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  copy(`${video.titulo}\n${video.gancho}\n${video.roteiro.join("\n")}`, "Roteiro")
                }
              >
                <Copy className="size-4" aria-hidden="true" />
                Copiar roteiro
              </Button>
            </div>
          ))}

          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-primary" aria-hidden="true" />
              <p className="text-sm font-bold text-card-foreground">Hashtags</p>
            </div>
            <p className="mt-2 break-words text-xs text-muted-foreground">
              {result.hashtags.join(" ")}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => copy(result.hashtags.join(" "), "Hashtags")}
            >
              <Copy className="size-4" aria-hidden="true" />
              Copiar hashtags
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm font-bold text-card-foreground">Legenda pronta</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{result.legenda}</p>
            <Button className="mt-3 w-full" onClick={() => copy(result.legenda, "Legenda")}>
              <Copy className="size-4" aria-hidden="true" />
              Copiar texto com 1 clique
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
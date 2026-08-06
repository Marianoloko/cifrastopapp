import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpenCheck, CalendarDays, Lightbulb, ListMusic, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { gerarPlanoEstudo, type StudyPlan } from "@/lib/study-plan.functions";
import { cn } from "@/lib/utils";

const NIVEIS = ["Iniciante do zero", "Intermediário", "Avançado"];
const TEMPOS = ["15 min", "30 min", "1 hora", "2 horas"];

type SavedPlan = {
  id: string;
  objetivo: string;
  nivel: string;
  tempo_diario: string;
  meta: string;
  plano: StudyPlan;
  created_at: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function PlanoEstudoIA() {
  const gerar = useServerFn(gerarPlanoEstudo);
  const queryClient = useQueryClient();
  const { data: access } = useAccess();
  const userId = access?.userId ?? null;

  const [open, setOpen] = useState(false);
  const [objetivo, setObjetivo] = useState("");
  const [nivel, setNivel] = useState(NIVEIS[0]);
  const [tempoDiario, setTempoDiario] = useState(TEMPOS[1]);
  const [meta, setMeta] = useState("");
  const [plano, setPlano] = useState<StudyPlan | null>(null);

  const songsQuery = useQuery({
    queryKey: ["songs-catalog", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("songs").select("id, title, artist, key");
      if (error) throw error;
      return data ?? [];
    },
  });

  const savedQuery = useQuery({
    queryKey: ["study-plans", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SavedPlan[];
    },
  });

  const mutation = useMutation({
    mutationFn: () => gerar({ data: { objetivo, nivel, tempoDiario, meta } }),
    onSuccess: (data) => {
      setPlano(data);
      setOpen(false);
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Não consegui montar seu plano."),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !plano) return;
      const { error } = await supabase.from("study_plans").insert({
        user_id: userId,
        objetivo,
        nivel,
        tempo_diario: tempoDiario,
        meta,
        plano: plano as never,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano salvo no seu perfil!");
      void queryClient.invalidateQueries({ queryKey: ["study-plans", userId] });
    },
    onError: () => toast.error("Não consegui salvar o plano."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano removido.");
      void queryClient.invalidateQueries({ queryKey: ["study-plans", userId] });
    },
  });

  const catalogo = songsQuery.data ?? [];
  const sugestoes = plano?.musicasSugeridas ?? [];
  const noRepertorio = sugestoes
    .map((item) => {
      const match = catalogo.find(
        (song) =>
          normalize(song.title).includes(normalize(item.titulo)) ||
          normalize(item.titulo).includes(normalize(song.title)),
      );
      return match ? { song: match, motivo: item.motivo } : null;
    })
    .filter(Boolean) as { song: (typeof catalogo)[number]; motivo: string }[];

  return (
    <div className="space-y-4">
      <Button
        className="h-12 w-full text-base font-bold"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-5" aria-hidden="true" />
        Criar Plano de Treino com IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plano de treino personalizado</DialogTitle>
            <DialogDescription>
              Responda 4 perguntinhas e a IA monta seu passo a passo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="objetivo">O que você quer aprender/tocar?</Label>
              <Textarea
                id="objetivo"
                value={objetivo}
                placeholder="Ex: tocar violão para acompanhar louvores"
                onChange={(event) => setObjetivo(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Qual o seu nível atual?</Label>
              <div className="flex flex-wrap gap-2">
                {NIVEIS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setNivel(item)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      item === nivel
                        ? "border-primary bg-primary/10 font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Quanto tempo você tem por dia?</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPOS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTempoDiario(item)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      item === tempoDiario
                        ? "border-primary bg-primary/10 font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="meta">Qual o seu principal objetivo?</Label>
              <Input
                id="meta"
                value={meta}
                placeholder="Ex: tocar na igreja no fim do mês"
                onChange={(event) => setMeta(event.target.value)}
              />
            </div>

            <Button
              className="h-12 w-full text-base font-bold"
              disabled={mutation.isPending || objetivo.trim().length < 3 || meta.trim().length < 2}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-5" aria-hidden="true" />
              )}
              Gerar meu plano
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {plano ? (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm font-bold text-card-foreground">
                Seu plano de {plano.duracaoSemanas} semanas
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plano.resumo}</p>
            {userId ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                <Save className="size-4" aria-hidden="true" />
                Salvar no meu perfil
              </Button>
            ) : null}
          </div>

          {plano.semanas.map((semana) => (
            <div key={semana.titulo} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm font-bold text-card-foreground">{semana.titulo}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{semana.foco}</p>
              <div className="mt-3 space-y-2">
                {semana.dias.map((dia) => (
                  <div key={dia.dia} className="rounded-xl bg-muted p-3">
                    <p className="text-xs font-bold text-foreground">{dia.dia}</p>
                    <ul className="mt-1 space-y-1">
                      {dia.atividades.map((atividade) => (
                        <li key={atividade} className="text-xs text-muted-foreground">
                          • {atividade}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {plano.dicas.length > 0 ? (
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-primary" aria-hidden="true" />
                <p className="text-sm font-bold text-card-foreground">Dicas do professor</p>
              </div>
              <ul className="mt-2 space-y-1">
                {plano.dicas.map((dica) => (
                  <li key={dica} className="text-xs text-muted-foreground">
                    • {dica}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {sugestoes.length > 0 ? (
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <ListMusic className="size-4 text-primary" aria-hidden="true" />
                <p className="text-sm font-bold text-card-foreground">Cifras recomendadas</p>
              </div>
              <div className="mt-2 space-y-2">
                {sugestoes.map((item) => (
                  <div key={`${item.titulo}-${item.artista}`} className="rounded-xl border p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {item.titulo} — {item.artista}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.motivo}</p>
                  </div>
                ))}
              </div>
              {noRepertorio.length > 0 ? (
                <div className="mt-3 rounded-xl bg-muted p-3">
                  <p className="text-xs font-bold text-foreground">Já no seu repertório</p>
                  <ul className="mt-1 space-y-1">
                    {noRepertorio.map(({ song }) => (
                      <li key={song.id} className="text-xs text-muted-foreground">
                        • {song.title} {song.artist ? `— ${song.artist}` : ""} (tom {song.key})
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Abra a aba Repertório para tocar essas cifras.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {savedQuery.data && savedQuery.data.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Planos salvos</p>
          {savedQuery.data.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-xl border bg-card p-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  setPlano(item.plano);
                  setObjetivo(item.objetivo);
                  setNivel(item.nivel);
                  setTempoDiario(item.tempo_diario);
                  setMeta(item.meta);
                }}
              >
                <span className="block truncate text-sm font-semibold text-foreground">
                  {item.objetivo}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.nivel} · {item.tempo_diario} por dia
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir plano"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

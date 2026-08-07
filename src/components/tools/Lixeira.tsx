import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

function daysLeft(deletedAt: string) {
  const ms = new Date(deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000 - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function Lixeira() {
  const queryClient = useQueryClient();

  const trashQuery = useQuery({
    queryKey: ["songs-trash"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist, deleted_at")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("songs").update({ deleted_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Música restaurada!");
      void queryClient.invalidateQueries({ queryKey: ["songs-trash"] });
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: () => toast.error("Não consegui restaurar a música."),
  });

  const purgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Música excluída definitivamente.");
      void queryClient.invalidateQueries({ queryKey: ["songs-trash"] });
    },
    onError: () => toast.error("Não consegui excluir a música."),
  });

  const items = trashQuery.data ?? [];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Itens excluídos ficam aqui por 7 dias e depois são apagados automaticamente.
      </p>
      {trashQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando lixeira…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          A lixeira está vazia.
        </p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.artist || "Sem artista"} · some em {daysLeft(item.deleted_at as string)} dia(s)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => restoreMutation.mutate(item.id)}
              disabled={restoreMutation.isPending}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Restaurar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${item.title} definitivamente`}
              onClick={() => purgeMutation.mutate(item.id)}
            >
              <Trash2 className="size-4 text-destructive" aria-hidden="true" />
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
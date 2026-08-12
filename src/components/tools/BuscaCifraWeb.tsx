import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, FolderPlus, Globe, Loader2, Save, Search } from "lucide-react";
import { toast } from "sonner";

import { SongView, type Song } from "@/components/song/SongView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { buscarCifraWeb, type CifraWebResult } from "@/lib/cifra-search.functions";
import type { CifraThemeId } from "@/lib/cifra-themes";
import type { UserModeId } from "@/lib/user-mode";

export function BuscaCifraWeb({
  userId,
  themeId,
  onThemeChange,
  mode,
}: {
  userId: string;
  themeId: CifraThemeId;
  onThemeChange: (id: CifraThemeId) => void;
  mode?: UserModeId;
}) {
  const buscar = useServerFn(buscarCifraWeb);
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<CifraWebResult | null>(null);
  const [folderId, setFolderId] = useState("");

  const foldersQuery = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("id, name")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const searchMutation = useMutation({
    mutationFn: () => buscar({ data: { query: term.trim() } }),
    onSuccess: (data) => setResult(data),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Não encontrei essa cifra."),
  });

  const saveMutation = useMutation({
    mutationFn: async (targetFolderId: string | null) => {
      if (!result) return;
      const { data, error } = await supabase
        .from("songs")
        .insert({
          user_id: userId,
          title: result.title.slice(0, 120),
          artist: result.artist.slice(0, 120),
          key: result.key || "C",
          capo: "Sem Capo",
          body: result.body,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (targetFolderId) {
        const { error: folderError } = await supabase
          .from("folder_songs")
          .insert({ user_id: userId, folder_id: targetFolderId, song_id: data.id });
        if (folderError) throw folderError;
      }
    },
    onSuccess: (_r, targetFolderId) => {
      toast.success(
        targetFolderId ? "Cifra salva na pasta escolhida!" : "Cifra salva no seu repertório!",
      );
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
      void queryClient.invalidateQueries({ queryKey: ["folder-songs"] });
    },
    onError: () => toast.error("Não consegui salvar essa cifra."),
  });

  if (result) {
    const preview: Song = {
      id: `web-${result.sourceUrl}`,
      title: result.title,
      artist: result.artist,
      key: result.key,
      capo: "Sem Capo",
      body: result.body,
    };
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
          <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar à busca
          </Button>
          <Button
            size="sm"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate(null)}
          >
            <Save className="size-4" aria-hidden="true" />
            Salvar no meu repertório
          </Button>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
              aria-label="Escolher pasta"
            >
              <option value="">Escolher pasta…</option>
              {(foldersQuery.data ?? []).map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={!folderId || saveMutation.isPending}
              onClick={() => saveMutation.mutate(folderId)}
            >
              <FolderPlus className="size-4" aria-hidden="true" />
              Adicionar a uma pasta
            </Button>
          </div>
        </div>
        <SongView
          song={preview}
          themeId={themeId}
          onThemeChange={onThemeChange}
          mode={mode}
          onBack={() => setResult(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-primary/30 bg-card p-3">
      <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Globe className="size-4 text-primary" aria-hidden="true" />
        Buscar qualquer cifra na web (Artista / Música)
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && term.trim().length > 1) searchMutation.mutate();
            }}
            placeholder="Ex.: Jorge e Mateus - Sossega"
            className="pl-9"
          />
        </div>
        <Button
          disabled={searchMutation.isPending || term.trim().length < 2}
          onClick={() => searchMutation.mutate()}
        >
          {searchMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
          Buscar
        </Button>
      </div>
    </div>
  );
}

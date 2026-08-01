import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { FileUp, Loader2, Music, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SongView, type Song } from "@/components/song/SongView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { NOTES_SHARP } from "@/lib/chords";
import type { CifraThemeId } from "@/lib/cifra-themes";

const CAPOS = [
  "Sem Capo",
  "1ª casa",
  "2ª casa",
  "3ª casa",
  "4ª casa",
  "5ª casa",
  "6ª casa",
  "7ª casa",
];

const emptyForm = { title: "", artist: "", key: "C", capo: "Sem Capo", body: "" };

function cleanCifraText(raw: string) {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/```+/g, "")
    .replace(/^\s*[*_#>-]{1,3}\s?/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function Repertorio({
  userId,
  themeId,
  onThemeChange,
}: {
  userId: string;
  themeId: CifraThemeId;
  onThemeChange: (id: CifraThemeId) => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const songsQuery = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Song[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("songs").insert({ ...form, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Música salva na nuvem!");
      setForm(emptyForm);
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: () => toast.error("Não consegui salvar a música."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
  });

  const fileImportMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const rows = await Promise.all(
        files.map(async (file) => {
          const text = cleanCifraText(await file.text());
          const name = file.name.replace(/\.(txt|text|md|cifra)$/i, "").trim();
          const [maybeArtist, maybeTitle] = name.split(/\s*-\s*/);
          return {
            user_id: userId,
            title: (maybeTitle || maybeArtist || "Sem título").slice(0, 120),
            artist: maybeTitle ? maybeArtist.slice(0, 120) : "",
            key: "C",
            capo: "Sem Capo",
            body: text,
          };
        }),
      );
      const { error } = await supabase.from("songs").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} música(s) importada(s) do arquivo!`);
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: () => toast.error("Não consegui importar esses arquivos."),
  });

  const songs = songsQuery.data ?? [];
  const filtered = songs.filter((song) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      song.title.toLowerCase().includes(term) || song.artist.toLowerCase().includes(term)
    );
  });

  const selected = songs.find((song) => song.id === selectedId) ?? null;

  if (selected) {
    return (
      <SongView
        song={selected}
        themeId={themeId}
        onThemeChange={onThemeChange}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por título ou artista"
          className="pl-9"
        />
      </div>

      <Button variant={showForm ? "outline" : "default"} className="w-full" onClick={() => setShowForm((v) => !v)}>
        <Plus className="size-4" aria-hidden="true" />
        {showForm ? "Fechar formulário" : "Nova música"}
      </Button>

      {showForm ? (
        <>
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <Label>Importar cifras salvas (TXT)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.text,.md,.cifra,text/plain"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length) fileImportMutation.mutate(files);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={fileImportMutation.isPending}
          >
            {fileImportMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileUp className="size-4" aria-hidden="true" />
            )}
            Escolher arquivos TXT
          </Button>
          <p className="text-xs text-muted-foreground">
            Traga cifras exportadas do Recifra ou de qualquer app em .txt. Use o nome do arquivo como
            "Artista - Música" para preencher automaticamente.
          </p>
        </div>
        <form
          className="space-y-3 rounded-xl border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.title.trim()) {
              toast.error("Informe o título da música.");
              return;
            }
            saveMutation.mutate();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="title">Título*</Label>
            <Input
              id="title"
              value={form.title}
              maxLength={120}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="artist">Artista</Label>
            <Input
              id="artist"
              value={form.artist}
              maxLength={120}
              onChange={(event) => setForm({ ...form, artist: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tom</Label>
              <Select value={form.key} onValueChange={(value) => setForm({ ...form, key: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTES_SHARP.map((note) => (
                    <SelectItem key={note} value={note}>
                      {note}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Capotraste</Label>
              <Select value={form.capo} onValueChange={(value) => setForm({ ...form, capo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAPOS.map((capo) => (
                    <SelectItem key={capo} value={capo}>
                      {capo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="body">Corpo da cifra</Label>
            <Textarea
              id="body"
              rows={12}
              className="font-mono text-xs"
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
            Salvar na nuvem
          </Button>
        </form>
        </>
      ) : null}

      <div className="space-y-2">
        {songsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando repertório…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhuma música no repertório ainda.
          </p>
        ) : (
          filtered.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => setSelectedId(song.id)}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-soft text-accent-foreground">
                  <Music className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {song.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {song.artist || "Sem artista"} · {song.key} · {song.capo}
                  </span>
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(song.id)}
                aria-label={`Excluir ${song.title}`}
              >
                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
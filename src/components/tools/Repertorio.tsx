import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  FileDown,
  FileUp,
  Folder,
  Loader2,
  Music,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { SongView, type Song } from "@/components/song/SongView";
import { BuscaCifraWeb } from "@/components/tools/BuscaCifraWeb";
import { Lixeira } from "@/components/tools/Lixeira";
import { SaveToFolder } from "@/components/tools/SaveToFolder";
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
import { STARTER_SONGS } from "@/lib/starter-songs";
import { exportSetlistPdf } from "@/lib/setlist-pdf";
import type { UserModeId } from "@/lib/user-mode";

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

const emptyForm = {
  title: "",
  artist: "",
  key: "C",
  capo: "Sem Capo",
  body: "",
  media_url: "",
  bpm: "",
};

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
  mode,
}: {
  userId: string;
  themeId: CifraThemeId;
  onThemeChange: (id: CifraThemeId) => void;
  mode?: UserModeId;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"lista" | "pastas" | "lixeira">("lista");
  const [folderId, setFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const songsQuery = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Song[];
    },
  });

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

  const folderSongsQuery = useQuery({
    queryKey: ["folder-songs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("folder_songs").select("folder_id, song_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("folders").insert({ name, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pasta criada!");
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    onError: () => toast.error("Não consegui criar a pasta."),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("folders")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setFolderId(null);
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("songs").insert({
        ...form,
        media_url: form.media_url || null,
        bpm: form.bpm ? Number(form.bpm) : null,
        user_id: userId,
      } as never);
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

  const starterMutation = useMutation({
    mutationFn: async () => {
      const rows = STARTER_SONGS.map((song) => ({ ...song, user_id: userId }));
      const { error } = await supabase.from("songs").insert(rows as never);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} músicas de exemplo adicionadas!`);
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: () => toast.error("Não consegui adicionar o repertório inicial."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("songs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Música movida para a lixeira (fica 7 dias lá).");
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
      void queryClient.invalidateQueries({ queryKey: ["songs-trash"] });
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
  const inFolder = folderId
    ? new Set(
        (folderSongsQuery.data ?? [])
          .filter((row) => row.folder_id === folderId)
          .map((row) => row.song_id),
      )
    : null;
  const filtered = songs.filter((song) => {
    if (inFolder && !inFolder.has(song.id)) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      song.title.toLowerCase().includes(term) || song.artist.toLowerCase().includes(term)
    );
  });

  const openSong = (id: string) => {
    setSelectedId(id);
    const song = songs.find((item) => item.id === id);
    if (song) {
      void supabase
        .from("song_plays")
        .insert({ song_id: song.id, title: song.title, artist: song.artist, user_id: userId });
    }
  };

  const selected = songs.find((song) => song.id === selectedId) ?? null;

  if (selected) {
    return (
      <SongView
        song={selected}
        themeId={themeId}
        onThemeChange={onThemeChange}
        mode={mode}
        playlist={filtered.map((item) => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
        }))}
        onSelectSong={setSelectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            { id: "lista", label: "Músicas" },
            { id: "pastas", label: "Pastas" },
            { id: "lixeira", label: "Lixeira" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setView(tab.id);
              if (tab.id !== "pastas") setFolderId(null);
            }}
            className={
              view === tab.id
                ? "rounded-lg bg-card px-3 py-2 text-sm font-bold text-card-foreground shadow-sm"
                : "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "lista" ? (
        <BuscaCifraWeb
          userId={userId}
          themeId={themeId}
          onThemeChange={onThemeChange}
          mode={mode}
        />
      ) : null}

      {view === "lixeira" ? <Lixeira /> : null}

      {view === "pastas" ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={createFolderMutation.isPending}
              onClick={() => {
                const name = window.prompt("Nome da pasta (ex.: Culto Domingo)");
                if (name && name.trim()) createFolderMutation.mutate(name.trim());
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova pasta
            </Button>
          </div>
          {(foldersQuery.data ?? []).length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma pasta criada ainda.
            </p>
          ) : (
            (foldersQuery.data ?? []).map((folder) => (
              <div key={folder.id} className="flex items-center gap-2 rounded-xl border bg-card p-3">
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setFolderId(folderId === folder.id ? null : folder.id)}
                >
                  <Folder className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate text-sm font-semibold text-foreground">
                    {folder.name}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {(folderSongsQuery.data ?? []).filter((row) => row.folder_id === folder.id).length}{" "}
                    música(s)
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir pasta ${folder.name}`}
                  onClick={() => deleteFolderMutation.mutate(folder.id)}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              </div>
            ))
          )}
        </div>
      ) : null}

      {view === "lixeira" ? null : (
      <>
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

      <div className="flex gap-2">
        <Button
          variant={showForm ? "outline" : "default"}
          className="flex-1"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="size-4" aria-hidden="true" />
          {showForm ? "Fechar formulário" : "Nova música"}
        </Button>
        <Button
          variant="outline"
          disabled={filtered.length === 0}
          onClick={() => {
            const ok = exportSetlistPdf(filtered);
            if (!ok) toast.error("Libere as janelas pop-up para gerar o PDF.");
          }}
          aria-label="Exportar setlist em PDF"
        >
          <FileDown className="size-4" aria-hidden="true" />
          PDF
        </Button>
      </div>

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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="media">Link do áudio/vídeo</Label>
              <Input
                id="media"
                value={form.media_url}
                placeholder="YouTube, Spotify ou MP3"
                onChange={(event) => setForm({ ...form, media_url: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                inputMode="numeric"
                value={form.bpm}
                onChange={(event) =>
                  setForm({ ...form, bpm: event.target.value.replace(/\D/g, "").slice(0, 3) })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
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
          <div className="space-y-3 rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma música no repertório ainda.</p>
            <Button
              variant="outline"
              onClick={() => starterMutation.mutate()}
              disabled={starterMutation.isPending}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Adicionar repertório inicial (3 músicas)
            </Button>
          </div>
        ) : (
          filtered.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => openSong(song.id)}
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
              <SaveToFolder userId={userId} songId={song.id} />
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
      </>
      )}
    </div>
  );
}
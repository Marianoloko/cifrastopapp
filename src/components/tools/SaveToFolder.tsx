import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export function SaveToFolder({ userId, songId }: { userId: string; songId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const foldersQuery = useQuery({
    queryKey: ["folders"],
    enabled: open,
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

  const addMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from("folder_songs")
        .insert({ folder_id: folderId, song_id: songId, user_id: userId });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      toast.success("Música salva na pasta!");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["folder-songs"] });
    },
    onError: () => toast.error("Não consegui salvar nessa pasta."),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .insert({ name: name.trim(), user_id: userId })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (folderId) => {
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
      addMutation.mutate(folderId);
    },
    onError: () => toast.error("Não consegui criar a pasta."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Salvar em uma pasta">
          <FolderPlus className="size-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar em uma pasta</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {foldersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando pastas…</p>
          ) : (foldersQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não tem pastas. Crie a primeira abaixo.
            </p>
          ) : (
            (foldersQuery.data ?? []).map((folder) => (
              <Button
                key={folder.id}
                variant="outline"
                className="w-full justify-start"
                disabled={addMutation.isPending}
                onClick={() => addMutation.mutate(folder.id)}
              >
                {folder.name}
              </Button>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={name}
            placeholder="Nova pasta (ex.: Culto Domingo)"
            onChange={(event) => setName(event.target.value)}
          />
          <Button
            disabled={!name.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Criar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
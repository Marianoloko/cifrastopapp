import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Megaphone, MessageCircle, Search, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  adminExpiredRecent,
  adminPurgeTrash,
  adminSearchMisses,
  adminTopSavedSongs,
} from "@/lib/admin.functions";

function useSetting<T>(key: string, fallback: T) {
  return useQuery({
    queryKey: ["app-settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return ((data?.value as T) ?? fallback) as T;
    },
  });
}

async function saveSetting(key: string, value: unknown) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) throw error;
}

export function GlobalBannerCard() {
  const queryClient = useQueryClient();
  const query = useSetting<{ enabled?: boolean; message?: string }>("banner", {});
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (query.data) {
      setEnabled(Boolean(query.data.enabled));
      setMessage(query.data.message ?? "");
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: () => saveSetting("banner", { enabled, message }),
    onSuccess: () => {
      toast.success("Aviso global atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["app-settings", "banner"] });
    },
    onError: () => toast.error("Não consegui salvar o aviso."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="size-4 text-primary" aria-hidden="true" />
          Aviso global
        </CardTitle>
        <CardDescription>
          Exibe um banner no topo do app para todos os usuários logados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch id="banner-on" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="banner-on">Exibir aviso</Label>
        </div>
        <Textarea
          rows={3}
          value={message}
          maxLength={300}
          placeholder="Ex.: Hoje o CifraStop está com 50% de desconto no plano anual!"
          onChange={(event) => setMessage(event.target.value)}
        />
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          Salvar aviso
        </Button>
      </CardContent>
    </Card>
  );
}

export function MaintenanceCard() {
  const queryClient = useQueryClient();
  const query = useSetting<{ enabled?: boolean; message?: string }>("maintenance", {});
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (query.data) {
      setEnabled(Boolean(query.data.enabled));
      setMessage(query.data.message ?? "");
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: () => saveSetting("maintenance", { enabled, message }),
    onSuccess: () => {
      toast.success("Modo manutenção atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["app-settings", "maintenance"] });
    },
    onError: () => toast.error("Não consegui salvar o modo manutenção."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="size-4 text-primary" aria-hidden="true" />
          Modo manutenção
        </CardTitle>
        <CardDescription>
          Bloqueia o app para usuários comuns. Administradores continuam com acesso normal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch id="maint-on" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="maint-on">Ativar manutenção</Label>
        </div>
        <Input
          value={message}
          maxLength={200}
          placeholder="Mensagem exibida na tela de manutenção"
          onChange={(event) => setMessage(event.target.value)}
        />
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
}

export function PurgeTrashCard() {
  const purge = useServerFn(adminPurgeTrash);
  const mutation = useMutation({
    mutationFn: () => purge(),
    onSuccess: (result: { songs: number; folders: number }) =>
      toast.success(`Limpeza concluída: ${result.songs} música(s) e ${result.folders} pasta(s).`),
    onError: () => toast.error("Não consegui executar a limpeza."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="size-4 text-primary" aria-hidden="true" />
          Limpeza da lixeira
        </CardTitle>
        <CardDescription>
          Apaga definitivamente itens na lixeira há mais de 7 dias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Executar limpeza agora
        </Button>
      </CardContent>
    </Card>
  );
}

export function TopSavedSongsCard() {
  const list = useServerFn(adminTopSavedSongs);
  const query = useQuery({ queryKey: ["admin-top-saved"], queryFn: () => list() });
  const rows = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 50 cifras mais salvas</CardTitle>
        <CardDescription>Ranking de músicas salvas no repertório dos usuários.</CardDescription>
      </CardHeader>
      <CardContent className="max-h-96 space-y-1 overflow-y-auto">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma cifra salva ainda.</p>
        ) : (
          rows.map((row, index) => (
            <div
              key={`${row.title}-${row.artist}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="truncate">
                {index + 1}. {row.title || "(sem título)"}
                <span className="text-muted-foreground"> — {row.artist || "Sem artista"}</span>
              </span>
              <span className="shrink-0 font-semibold">{row.saves}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function SearchMissesCard() {
  const list = useServerFn(adminSearchMisses);
  const query = useQuery({ queryKey: ["admin-search-misses"], queryFn: () => list() });
  const rows = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="size-4 text-primary" aria-hidden="true" />
          Buscas sem resultado
        </CardTitle>
        <CardDescription>O que os usuários procuraram e o app não encontrou.</CardDescription>
      </CardHeader>
      <CardContent className="max-h-96 space-y-1 overflow-y-auto">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma busca frustrada registrada.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-lg border px-3 py-2 text-sm">
              <p className="font-medium">{row.query}</p>
              <p className="text-xs text-muted-foreground">
                {row.email ?? "usuário anônimo"} · {new Date(row.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function ExpiredOfferCard() {
  const list = useServerFn(adminExpiredRecent);
  const query = useQuery({ queryKey: ["admin-expired"], queryFn: () => list() });
  const [message, setMessage] = useState(
    "Oi! Seu teste do CifraStop terminou. Quer liberar tudo por R$ 15,00 no mês?",
  );
  const rows = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-4 text-primary" aria-hidden="true" />
          Oferta em massa para expirados
        </CardTitle>
        <CardDescription>
          Testes encerrados nos últimos 7 dias ({rows.length} usuário(s)).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea rows={3} value={message} onChange={(event) => setMessage(event.target.value)} />
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum teste expirado nesse período.</p>
          ) : (
            rows.map((row) => {
              const digits = (row.phone ?? "").replace(/\D/g, "");
              const full = digits.startsWith("55") ? digits : `55${digits}`;
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {row.email}
                    <span className="text-muted-foreground">
                      {" "}
                      · expirou em {new Date(row.expired_at).toLocaleString("pt-BR")}
                    </span>
                  </span>
                  {digits ? (
                    <a
                      href={`https://wa.me/${full}?text=${encodeURIComponent(message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-primary"
                    >
                      <MessageCircle className="size-3" aria-hidden="true" />
                      Disparar oferta
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">sem WhatsApp</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

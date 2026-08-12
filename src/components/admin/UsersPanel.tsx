import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Ban,
  ChevronDown,
  Crown,
  Eye,
  FileDown,
  FolderOpen,
  KeyRound,
  LogOut,
  MessageCircle,
  Music2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SongView, type Song } from "@/components/song/SongView";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  adminDeleteUser,
  adminForceLogout,
  adminListUserFolders,
  adminSetLifetimeVip,
  adminSetNotes,
  adminListUserSongs,
  adminListUsers,
  adminResetPassword,
  adminSetAccess,
  adminSetBan,
  type AdminUser,
} from "@/lib/admin.functions";

const accessLabel: Record<AdminUser["access"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  vip: { label: "VIP", variant: "default" },
  trial: { label: "Em teste", variant: "secondary" },
  expired: { label: "Expirado", variant: "outline" },
  banido: { label: "Banido", variant: "destructive" },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}`;
}

function UserSongs({ userId }: { userId: string }) {
  const listSongs = useServerFn(adminListUserSongs);
  const [openSong, setOpenSong] = useState<string | null>(null);
  const songsQuery = useQuery({
    queryKey: ["admin-user-songs", userId],
    queryFn: () => listSongs({ data: { userId } }),
  });

  if (songsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando músicas salvas…</p>;
  }
  if (songsQuery.isError) {
    return <p className="text-sm text-destructive">Não consegui carregar as músicas.</p>;
  }
  const songs = songsQuery.data ?? [];
  if (songs.length === 0) {
    return <p className="text-sm text-muted-foreground">Este usuário ainda não salvou músicas.</p>;
  }

  return (
    <div className="space-y-2">
      {songs.map((song) => {
        const open = openSong === song.id;
        return (
          <div key={song.id} className="rounded-lg border bg-muted/30">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 p-2 text-left"
              onClick={() => setOpenSong(open ? null : song.id)}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{song.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {song.artist || "Sem artista"} · Tom {song.key || "—"} · {song.capo || "sem capo"} ·
                  salva em {formatDate(song.created_at)}
                </span>
              </span>
              <ChevronDown
                className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {open ? (
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap border-t p-2 font-mono text-xs">
                {song.body || "(cifra vazia)"}
              </pre>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}


function UserFolders({ userId }: { userId: string }) {
  const listFolders = useServerFn(adminListUserFolders);
  const query = useQuery({
    queryKey: ["admin-user-folders", userId],
    queryFn: () => listFolders({ data: { userId } }),
  });

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Carregando pastas…</p>;
  const folders = query.data ?? [];
  if (folders.length === 0) {
    return <p className="text-sm text-muted-foreground">Este usuário não criou pastas.</p>;
  }
  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
        >
          <span className="truncate">{folder.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{folder.songs} música(s)</span>
        </div>
      ))}
    </div>
  );
}

function ImpersonateDialog({
  userId,
  email,
  open,
  onOpenChange,
}: {
  userId: string;
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const listSongs = useServerFn(adminListUserSongs);
  const [selected, setSelected] = useState<Song | null>(null);
  const query = useQuery({
    queryKey: ["admin-user-songs", userId],
    queryFn: () => listSongs({ data: { userId } }),
    enabled: open,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setSelected(null);
        onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modo impersonar</DialogTitle>
          <DialogDescription>
            Você está navegando no repertório de {email} como se fosse ele (somente leitura).
          </DialogDescription>
        </DialogHeader>
        {selected ? (
          <SongView
            song={selected}
            themeId="cifraclub"
            onThemeChange={() => {}}
            onBack={() => setSelected(null)}
          />
        ) : query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando repertório…</p>
        ) : (query.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Este usuário não tem músicas salvas.</p>
        ) : (
          <div className="space-y-1">
            {(query.data ?? []).map((song) => (
              <button
                key={song.id}
                type="button"
                className="w-full rounded-lg border px-3 py-2 text-left text-sm"
                onClick={() =>
                  setSelected({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    key: song.key || "C",
                    capo: song.capo || "Sem Capo",
                    body: song.body,
                  })
                }
              >
                <span className="block truncate font-medium">{song.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {song.artist || "Sem artista"} · Tom {song.key || "—"}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UsersPanel() {
  const queryClient = useQueryClient();
  const listUsers = useServerFn(adminListUsers);
  const setBanFn = useServerFn(adminSetBan);
  const deleteUserFn = useServerFn(adminDeleteUser);
  const setAccessFn = useServerFn(adminSetAccess);
  const resetPasswordFn = useServerFn(adminResetPassword);
  const lifetimeFn = useServerFn(adminSetLifetimeVip);
  const forceLogoutFn = useServerFn(adminForceLogout);
  const setNotesFn = useServerFn(adminSetNotes);

  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [songsOpenId, setSongsOpenId] = useState<string | null>(null);
  const [daysById, setDaysById] = useState<Record<string, string>>({});
  const [passwordById, setPasswordById] = useState<Record<string, string>>({});
  const [detailTabById, setDetailTabById] = useState<Record<string, "musicas" | "pastas">>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [waMessageById, setWaMessageById] = useState<Record<string, string>>({});
  const [impersonateId, setImpersonateId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
    refetchInterval: 60_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  const onError = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : "Não consegui concluir a ação.");

  const banMutation = useMutation({
    mutationFn: (vars: { userId: string; banned: boolean }) => setBanFn({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success(vars.banned ? "Usuário banido." : "Usuário desbanido.");
      void refresh();
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUserFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuário excluído.");
      void refresh();
    },
    onError,
  });

  const accessMutation = useMutation({
    mutationFn: (vars: { userId: string; days: number }) => setAccessFn({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success(vars.days > 0 ? `Acesso liberado por ${vars.days} dias.` : "Acesso removido.");
      void refresh();
    },
    onError,
  });

  const passwordMutation = useMutation({
    mutationFn: (vars: { userId: string; password: string }) => resetPasswordFn({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success("Senha redefinida. Avise o usuário pelo WhatsApp.");
      setPasswordById((prev) => ({ ...prev, [vars.userId]: "" }));
    },
    onError,
  });

  const lifetimeMutation = useMutation({
    mutationFn: (userId: string) => lifetimeFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("VIP vitalício liberado.");
      void refresh();
    },
    onError,
  });

  const logoutMutation = useMutation({
    mutationFn: (userId: string) => forceLogoutFn({ data: { userId } }),
    onSuccess: () => toast.success("Sessões encerradas. O usuário precisará entrar de novo."),
    onError,
  });

  const notesMutation = useMutation({
    mutationFn: (vars: { userId: string; notes: string }) => setNotesFn({ data: vars }),
    onSuccess: () => {
      toast.success("Nota privada salva.");
      void refresh();
    },
    onError,
  });

  const users = usersQuery.data ?? [];

  const exportCsv = () => {
    const header = ["Nome", "Email", "WhatsApp", "Status", "Data de cadastro"];
    const lines = filtered.map((user) =>
      [
        user.full_name ?? "",
        user.email,
        user.phone ?? "",
        accessLabel[user.access].label,
        formatDate(user.created_at),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const csv = `\uFEFF${[header.join(";"), ...lines].join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `usuarios-cifrastop-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term) ||
        (user.referral_code ?? "").toLowerCase().includes(term) ||
        (user.phone ?? "").toLowerCase().includes(term),
    );
  }, [users, search]);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Usuários cadastrados</CardTitle>
            <CardDescription>
              Histórico completo de contas: plano, teste, indicações, músicas e ações de moderação.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <FileDown className="size-4" aria-hidden="true" />
              Exportar usuários em CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Atualizar
            </Button>
          </div>
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por e-mail, ID, telefone ou código de indicação"
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {usersQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando usuários…</p>
        ) : null}
        {usersQuery.isError ? (
          <p className="text-sm text-destructive">Não consegui carregar a lista de usuários.</p>
        ) : null}
        {!usersQuery.isLoading && filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
        ) : null}

        {filtered.map((user) => {
          const open = openId === user.id;
          const badge = accessLabel[user.access];
          return (
            <div key={user.id} className="rounded-lg border">
              <button
                type="button"
                className="flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left"
                onClick={() => setOpenId(open ? null : user.id)}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    <span
                      className={`mr-1 inline-block size-2 rounded-full align-middle ${
                        user.online ? "bg-green-500" : "bg-muted-foreground/40"
                      }`}
                      aria-label={user.online ? "Online agora" : "Offline"}
                    />
                    {user.email || "(sem e-mail)"}
                    {user.is_admin ? (
                      <ShieldCheck className="ml-1 inline size-4 text-primary" aria-hidden="true" />
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cadastro em {formatDate(user.created_at)} · Visto por último em{" "}
                    {formatDate(user.last_seen_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <ChevronDown
                    className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </div>
              </button>

              {open ? (
                <div className="space-y-4 border-t p-3">
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">ID do usuário</dt>
                      <dd className="break-all font-mono text-xs">{user.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Telefone</dt>
                      <dd className="flex items-center gap-2">
                        {user.phone || "—"}
                        {user.phone ? (
                          <a
                            href={whatsappLink(user.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            <MessageCircle className="size-3" aria-hidden="true" />
                            WhatsApp
                          </a>
                        ) : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Plano / assinatura</dt>
                      <dd>
                        {user.subscription_status} · até {formatDate(user.current_period_end)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Início do teste</dt>
                      <dd>{formatDate(user.trial_started_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Código de indicação</dt>
                      <dd className="font-mono">{user.referral_code ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Amigos indicados</dt>
                      <dd>{user.referrals_count}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Músicas salvas</dt>
                      <dd>{user.songs_count}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Banido em</dt>
                      <dd>{formatDate(user.banned_at)}</dd>
                    </div>
                  </dl>

                  <div className="space-y-2 rounded-lg border p-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSongsOpenId(songsOpenId === user.id ? null : user.id)}
                      >
                        <Music2 className="size-4" aria-hidden="true" />
                        {songsOpenId === user.id ? "Fechar conteúdo" : "Ver músicas e pastas"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setImpersonateId(user.id)}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                        Modo impersonar
                      </Button>
                    </div>
                    {songsOpenId === user.id ? (
                      <>
                        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                          {(["musicas", "pastas"] as const).map((tabId) => (
                            <button
                              key={tabId}
                              type="button"
                              onClick={() =>
                                setDetailTabById((prev) => ({ ...prev, [user.id]: tabId }))
                              }
                              className={
                                (detailTabById[user.id] ?? "musicas") === tabId
                                  ? "rounded-md bg-card px-3 py-1 text-xs font-bold"
                                  : "rounded-md px-3 py-1 text-xs text-muted-foreground"
                              }
                            >
                              {tabId === "musicas"
                                ? `Cifras (${user.songs_count})`
                                : "Pastas"}
                            </button>
                          ))}
                        </div>
                        {(detailTabById[user.id] ?? "musicas") === "musicas" ? (
                          <UserSongs userId={user.id} />
                        ) : (
                          <UserFolders userId={user.id} />
                        )}
                      </>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-end gap-2 rounded-lg border p-2">
                    <Button
                      size="sm"
                      disabled={lifetimeMutation.isPending}
                      onClick={() => lifetimeMutation.mutate(user.id)}
                    >
                      <Crown className="size-4" aria-hidden="true" />
                      VIP vitalício
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={logoutMutation.isPending}
                      onClick={() => logoutMutation.mutate(user.id)}
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Forçar logout
                    </Button>
                    <div className="min-w-52 flex-1 space-y-1">
                      <label className="text-xs text-muted-foreground" htmlFor={`wa-${user.id}`}>
                        Mensagem no WhatsApp
                      </label>
                      <Input
                        id={`wa-${user.id}`}
                        value={waMessageById[user.id] ?? ""}
                        placeholder="Olá! Aqui é do CifraStop…"
                        onChange={(event) =>
                          setWaMessageById((prev) => ({ ...prev, [user.id]: event.target.value }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!user.phone}
                      onClick={() => {
                        if (!user.phone) return;
                        const text = waMessageById[user.id] ?? "";
                        window.open(
                          `${whatsappLink(user.phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      WhatsApp direto
                    </Button>
                  </div>

                  <div className="space-y-2 rounded-lg border p-2">
                    <label className="text-xs text-muted-foreground" htmlFor={`notes-${user.id}`}>
                      Notas privadas do admin
                    </label>
                    <Textarea
                      id={`notes-${user.id}`}
                      rows={3}
                      value={notesById[user.id] ?? user.admin_notes ?? ""}
                      onChange={(event) =>
                        setNotesById((prev) => ({ ...prev, [user.id]: event.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={notesMutation.isPending}
                      onClick={() =>
                        notesMutation.mutate({
                          userId: user.id,
                          notes: notesById[user.id] ?? user.admin_notes ?? "",
                        })
                      }
                    >
                      Salvar nota
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-end gap-2 rounded-lg border p-2">
                    <div className="min-w-48 flex-1 space-y-1">
                      <label className="text-xs text-muted-foreground" htmlFor={`pwd-${user.id}`}>
                        Nova senha para este usuário
                      </label>
                      <Input
                        id={`pwd-${user.id}`}
                        type="text"
                        autoComplete="off"
                        placeholder="Mínimo 6 caracteres"
                        value={passwordById[user.id] ?? ""}
                        onChange={(event) =>
                          setPasswordById((prev) => ({ ...prev, [user.id]: event.target.value }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={passwordMutation.isPending || (passwordById[user.id] ?? "").length < 6}
                      onClick={() =>
                        passwordMutation.mutate({
                          userId: user.id,
                          password: passwordById[user.id] ?? "",
                        })
                      }
                    >
                      <KeyRound className="size-4" aria-hidden="true" />
                      Redefinir senha
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <div className="w-28 space-y-1">
                      <label className="text-xs text-muted-foreground" htmlFor={`days-${user.id}`}>
                        Dias de VIP
                      </label>
                      <Input
                        id={`days-${user.id}`}
                        type="number"
                        min={0}
                        value={daysById[user.id] ?? "30"}
                        onChange={(event) =>
                          setDaysById((prev) => ({ ...prev, [user.id]: event.target.value }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={accessMutation.isPending}
                      onClick={() =>
                        accessMutation.mutate({
                          userId: user.id,
                          days: Number(daysById[user.id] ?? "30") || 0,
                        })
                      }
                    >
                      Liberar acesso
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={accessMutation.isPending}
                      onClick={() => accessMutation.mutate({ userId: user.id, days: 0 })}
                    >
                      Remover acesso
                    </Button>
                    <Button
                      size="sm"
                      variant={user.banned ? "outline" : "secondary"}
                      disabled={banMutation.isPending}
                      onClick={() => banMutation.mutate({ userId: user.id, banned: !user.banned })}
                    >
                      <Ban className="size-4" aria-hidden="true" />
                      {user.banned ? "Desbanir" : "Banir"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Excluir definitivamente ${user.email}?`)) {
                          deleteMutation.mutate(user.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
      {impersonateId ? (
        <ImpersonateDialog
          userId={impersonateId}
          email={users.find((user) => user.id === impersonateId)?.email ?? ""}
          open={Boolean(impersonateId)}
          onOpenChange={(open) => {
            if (!open) setImpersonateId(null);
          }}
        />
      ) : null}
    </Card>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Ban, ChevronDown, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminDeleteUser,
  adminListUsers,
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

export function UsersPanel() {
  const queryClient = useQueryClient();
  const listUsers = useServerFn(adminListUsers);
  const setBanFn = useServerFn(adminSetBan);
  const deleteUserFn = useServerFn(adminDeleteUser);
  const setAccessFn = useServerFn(adminSetAccess);

  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [daysById, setDaysById] = useState<Record<string, string>>({});

  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: () => listUsers() });

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

  const users = usersQuery.data ?? [];
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
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Atualizar
          </Button>
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
                    {user.email || "(sem e-mail)"}
                    {user.is_admin ? (
                      <ShieldCheck className="ml-1 inline size-4 text-primary" aria-hidden="true" />
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cadastro em {formatDate(user.created_at)}
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
                      <dd>{user.phone || "—"}</dd>
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
    </Card>
  );
}

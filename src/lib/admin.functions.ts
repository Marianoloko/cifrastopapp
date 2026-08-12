import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminPlan = {
  id: string | null;
  name: string;
  description: string;
  price_label: string;
  period_label: string;
  duration_days: number;
  badge: string | null;
  featured: boolean;
  whatsapp_message: string;
  features: string[];
  active: boolean;
  sort_order: number;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Acesso restrito ao administrador.");
}

export const adminIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return data === true;
  });

export const adminListPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPlan[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price_label: plan.price_label,
      period_label: plan.period_label,
      duration_days: plan.duration_days,
      badge: plan.badge,
      featured: plan.featured,
      whatsapp_message: plan.whatsapp_message,
      features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
      active: plan.active,
      sort_order: plan.sort_order,
    }));
  });

const planSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1).max(80),
  description: z.string().max(300),
  price_label: z.string().max(40),
  period_label: z.string().max(40),
  duration_days: z.number().int().min(1).max(3650),
  badge: z.string().max(40).nullable(),
  featured: z.boolean(),
  whatsapp_message: z.string().max(600),
  features: z.array(z.string().max(120)).max(20),
  active: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
});

export const adminSavePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => planSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      description: data.description,
      price_label: data.price_label,
      period_label: data.period_label,
      duration_days: data.duration_days,
      badge: data.badge || null,
      featured: data.featured,
      whatsapp_message: data.whatsapp_message,
      features: data.features,
      active: data.active,
      sort_order: data.sort_order,
      updated_at: new Date().toISOString(),
    };
    const query = data.id
      ? supabaseAdmin.from("plans").update(payload).eq("id", data.id)
      : supabaseAdmin.from("plans").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGrantAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().trim().email().max(255), planId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ until: string }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error("Nenhum usuário encontrado com esse e-mail.");

    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("duration_days")
      .eq("id", data.planId)
      .maybeSingle();
    if (planError) throw new Error(planError.message);
    if (!plan) throw new Error("Plano não encontrado.");

    const until = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000);
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: profile.id,
        status: "active",
        current_period_end: until.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);

    return { until: until.toLocaleDateString("pt-BR") };
  });
export type AdminUser = {
  id: string;
  email: string;
  phone: string | null;
  created_at: string;
  trial_started_at: string;
  banned: boolean;
  banned_at: string | null;
  referral_code: string | null;
  referrals_count: number;
  songs_count: number;
  is_admin: boolean;
  subscription_status: string;
  current_period_end: string | null;
  access: "vip" | "trial" | "expired" | "banido";
  last_seen_at: string | null;
  online: boolean;
  full_name: string | null;
  admin_notes: string | null;
};

const TRIAL_MS = 4 * 60 * 60 * 1000;

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profilesRes, subsRes, rolesRes, songsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("subscriptions").select("user_id, status, current_period_end"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("songs").select("user_id"),
    ]);
    if (profilesRes.error) throw new Error(profilesRes.error.message);

    const subs = new Map<string, any>((subsRes.data ?? []).map((s: any) => [s.user_id, s]));
    const admins = new Set<string>(
      (rolesRes.data ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id),
    );
    const songs = new Map<string, number>();
    for (const song of songsRes.data ?? []) {
      songs.set((song as any).user_id, (songs.get((song as any).user_id) ?? 0) + 1);
    }
    const referrals = new Map<string, number>();
    for (const profile of profilesRes.data ?? []) {
      const ref = (profile as any).referred_by;
      if (ref) referrals.set(ref, (referrals.get(ref) ?? 0) + 1);
    }

    const now = Date.now();
    return (profilesRes.data ?? []).map((profile: any) => {
      const sub = subs.get(profile.id);
      const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;
      const vip = sub?.status === "active" && (periodEnd === null || periodEnd > now);
      const trialEnd = new Date(profile.trial_started_at).getTime() + TRIAL_MS;
      const access: AdminUser["access"] = profile.banned
        ? "banido"
        : vip
          ? "vip"
          : trialEnd > now
            ? "trial"
            : "expired";
      return {
        id: profile.id,
        email: profile.email ?? "",
        phone: profile.phone ?? null,
        created_at: profile.created_at,
        trial_started_at: profile.trial_started_at,
        banned: Boolean(profile.banned),
        banned_at: profile.banned_at ?? null,
        referral_code: profile.referral_code ?? null,
        referrals_count: referrals.get(profile.id) ?? 0,
        songs_count: songs.get(profile.id) ?? 0,
        is_admin: admins.has(profile.id),
        subscription_status: sub?.status ?? "inactive",
        current_period_end: sub?.current_period_end ?? null,
        access,
        last_seen_at: profile.last_seen_at ?? null,
        online: profile.last_seen_at
          ? now - new Date(profile.last_seen_at).getTime() < 5 * 60 * 1000
          : false,
        full_name: profile.full_name ?? null,
        admin_notes: profile.admin_notes ?? null,
      };
    });
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ userId: z.string().uuid(), password: z.string().min(6).max(72) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), banned: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Você não pode banir a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        banned: data.banned,
        banned_at: data.banned ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.banned ? "876000h" : "none",
    });
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), days: z.number().int().min(0).max(3650) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ until: string | null }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const until =
      data.days > 0 ? new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString() : null;
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: data.userId,
        status: data.days > 0 ? "active" : "inactive",
        current_period_end: until,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { until };
  });

export type AdminUserSong = {
  id: string;
  title: string;
  artist: string;
  key: string;
  capo: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export const adminListUserSongs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<AdminUserSong[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: songs, error } = await supabaseAdmin
      .from("songs")
      .select("id, title, artist, key, capo, body, created_at, updated_at")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (songs ?? []).map((song: any) => ({
      id: song.id,
      title: song.title ?? "",
      artist: song.artist ?? "",
      key: song.key ?? "",
      capo: song.capo ?? "",
      body: song.body ?? "",
      created_at: song.created_at,
      updated_at: song.updated_at,
    }));
  });

export type TrafficStats = {
  totalVisits: number;
  visits7d: number;
  visits30d: number;
  bySource: { source: string; count: number }[];
  byPath: { path: string; count: number }[];
  users: number;
  songs: number;
};

export const adminTrafficStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TrafficStats> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const since7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const [eventsResult, usersResult, songsResult] = await Promise.all([
      supabaseAdmin
        .from("traffic_events")
        .select("path, source, created_at")
        .gte("created_at", since30)
        .limit(5000),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("songs").select("id", { count: "exact", head: true }),
    ]);

    const events = (eventsResult.data ?? []) as { path: string; source: string | null; created_at: string }[];
    const sources = new Map<string, number>();
    const paths = new Map<string, number>();
    let visits7d = 0;

    for (const event of events) {
      const source = event.source || "direto";
      sources.set(source, (sources.get(source) ?? 0) + 1);
      paths.set(event.path, (paths.get(event.path) ?? 0) + 1);
      if (event.created_at >= since7) visits7d += 1;
    }

    const sortDesc = (map: Map<string, number>) =>
      [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    return {
      totalVisits: events.length,
      visits7d,
      visits30d: events.length,
      bySource: sortDesc(sources).map(([source, count]) => ({ source, count })),
      byPath: sortDesc(paths).map(([path, count]) => ({ path, count })),
      users: usersResult.count ?? 0,
      songs: songsResult.count ?? 0,
    };
  });

export const adminSetNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), notes: z.string().max(4000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ admin_notes: data.notes, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetLifetimeVip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: data.userId,
        status: "active",
        current_period_end: "2999-12-31T00:00:00Z",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminForceLogout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
    const response = await fetch(`${url}/auth/v1/admin/users/${data.userId}/logout`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok && response.status !== 204) {
      throw new Error("Não consegui encerrar as sessões desse usuário.");
    }
    return { ok: true };
  });

export type AdminFolder = { id: string; name: string; songs: number; created_at: string };

export const adminListUserFolders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<AdminFolder[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [foldersRes, linksRes] = await Promise.all([
      supabaseAdmin
        .from("folders")
        .select("id, name, created_at")
        .eq("user_id", data.userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("folder_songs").select("folder_id").eq("user_id", data.userId),
    ]);
    if (foldersRes.error) throw new Error(foldersRes.error.message);
    const counts = new Map<string, number>();
    for (const link of linksRes.data ?? []) {
      const id = (link as any).folder_id as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return (foldersRes.data ?? []).map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      created_at: folder.created_at,
      songs: counts.get(folder.id) ?? 0,
    }));
  });

export type TopSavedSong = { title: string; artist: string; saves: number };

export const adminTopSavedSongs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TopSavedSong[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("songs")
      .select("title, artist")
      .is("deleted_at", null)
      .limit(10000);
    if (error) throw new Error(error.message);
    const counts = new Map<string, TopSavedSong>();
    for (const row of data ?? []) {
      const title = ((row as any).title ?? "").trim();
      const artist = ((row as any).artist ?? "").trim();
      const key = `${title.toLowerCase()}::${artist.toLowerCase()}`;
      const current = counts.get(key);
      if (current) current.saves += 1;
      else counts.set(key, { title, artist, saves: 1 });
    }
    return [...counts.values()].sort((a, b) => b.saves - a.saves).slice(0, 50);
  });

export type SearchMiss = { id: string; query: string; created_at: string; email: string | null };

export const adminSearchMisses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SearchMiss[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("search_misses")
      .select("id, query, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const ids = [...new Set((data ?? []).map((row: any) => row.user_id).filter(Boolean))];
    const emails = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .in("id", ids as string[]);
      for (const profile of profiles ?? []) emails.set((profile as any).id, (profile as any).email ?? "");
    }
    return (data ?? []).map((row: any) => ({
      id: row.id,
      query: row.query,
      created_at: row.created_at,
      email: row.user_id ? (emails.get(row.user_id) ?? null) : null,
    }));
  });

export type ExpiredUser = { id: string; email: string; phone: string | null; expired_at: string };

export const adminExpiredRecent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExpiredUser[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profilesRes, subsRes, settingRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, email, phone, trial_started_at, banned"),
      supabaseAdmin.from("subscriptions").select("user_id, status, current_period_end"),
      supabaseAdmin.from("app_settings").select("value").eq("key", "trial").maybeSingle(),
    ]);
    if (profilesRes.error) throw new Error(profilesRes.error.message);
    const hours = ((settingRes.data as any)?.value?.hours as number | undefined) ?? 4;
    const trialMs = hours * 60 * 60 * 1000;
    const subs = new Map<string, any>((subsRes.data ?? []).map((s: any) => [s.user_id, s]));
    const now = Date.now();
    const window7d = 7 * 24 * 60 * 60 * 1000;

    return (profilesRes.data ?? [])
      .map((profile: any) => {
        const sub = subs.get(profile.id);
        const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;
        const vip = sub?.status === "active" && (periodEnd === null || periodEnd > now);
        const trialEnd = new Date(profile.trial_started_at).getTime() + trialMs;
        if (vip || profile.banned) return null;
        if (trialEnd > now || now - trialEnd > window7d) return null;
        return {
          id: profile.id,
          email: profile.email ?? "",
          phone: profile.phone ?? null,
          expired_at: new Date(trialEnd).toISOString(),
        };
      })
      .filter(Boolean) as ExpiredUser[];
  });

export const adminPurgeTrash = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ songs: number; folders: number }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [songsRes, foldersRes] = await Promise.all([
      supabaseAdmin.from("songs").delete().lt("deleted_at", cutoff).select("id"),
      supabaseAdmin.from("folders").delete().lt("deleted_at", cutoff).select("id"),
    ]);
    if (songsRes.error) throw new Error(songsRes.error.message);
    if (foldersRes.error) throw new Error(foldersRes.error.message);
    return { songs: (songsRes.data ?? []).length, folders: (foldersRes.data ?? []).length };
  });

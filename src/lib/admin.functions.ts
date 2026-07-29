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
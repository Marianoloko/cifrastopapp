import { supabase } from "@/integrations/supabase/client";

export async function logVisit(path: string) {
  if (typeof window === "undefined") return;
  try {
    const key = `cifrastop-visit:${path}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    const params = new URLSearchParams(window.location.search);
    const source =
      params.get("utm_source") ??
      params.get("ref_source") ??
      (document.referrer ? new URL(document.referrer).hostname : "direto");
    const { data } = await supabase.auth.getUser();
    await supabase.from("traffic_events").insert({
      path,
      source,
      user_id: data.user?.id ?? null,
    } as never);
  } catch {
    // logging de tráfego nunca deve quebrar a navegação
  }
}

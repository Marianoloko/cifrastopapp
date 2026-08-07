import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { TRIAL_MS, type AccessStatus } from "@/lib/access";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useAccess() {
  const now = useNow(1000);

  const query = useQuery({
    queryKey: ["access"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return null;

      const [profileResult, subscriptionResult, settingsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("status, current_period_end")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.from("app_settings").select("value").eq("key", "trial").maybeSingle(),
      ]);

      const hours = (settingsResult.data?.value as { hours?: number } | null)?.hours;
      const trialMs =
        typeof hours === "number" && hours > 0 ? hours * 60 * 60 * 1000 : TRIAL_MS;

      return {
        userId,
        email: userData.user?.email ?? "",
        profile: profileResult.data,
        subscription: subscriptionResult.data,
        trialMs,
      };
    },
  });

  let status: AccessStatus = "loading";
  let remainingMs = 0;

  if (query.isError) {
    status = "expired";
  } else if (query.data === null) {
    status = "expired";
  } else if (query.data) {
    const subscription = query.data.subscription;
    const trialMs = query.data.trialMs ?? TRIAL_MS;
    const banned = Boolean((query.data.profile as { banned?: boolean } | null)?.banned);
    const trialStart = query.data.profile?.trial_started_at
      ? new Date(query.data.profile.trial_started_at).getTime()
      : null;

    const periodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end).getTime()
      : null;
    const subscriptionActive =
      subscription?.status === "active" && (periodEnd === null || periodEnd > now);

    if (banned) {
      status = "expired";
    } else if (subscriptionActive) {
      status = "subscriber";
    } else if (trialStart !== null && trialStart + trialMs > now) {
      status = "trial";
      remainingMs = trialStart + trialMs - now;
    } else {
      status = "expired";
    }
  }

  return { ...query, status, remainingMs, now };
}
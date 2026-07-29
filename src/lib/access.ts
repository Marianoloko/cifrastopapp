export const TRIAL_MS = 4 * 60 * 60 * 1000; // 4 horas

export const WHATSAPP_NUMBER = "5598987150431";

export function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function openWhatsApp(message: string) {
  const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(link, "_blank", "noopener");
}

export type AccessStatus = "loading" | "subscriber" | "trial" | "expired";
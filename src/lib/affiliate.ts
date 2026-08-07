const KEY = "cifrastop:ref";

export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && ref.trim()) {
    window.localStorage.setItem(KEY, ref.trim().toUpperCase());
  }
}

export function getStoredReferral(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY) ?? "";
}

export function clearStoredReferral() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
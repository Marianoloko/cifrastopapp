const KEY = "cifrastop_ref";
const LEGACY_KEY = "cifrastop:ref";
const MAX_AGE_DAYS = 30;

function setCookie(value: string) {
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${KEY}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function readCookie(): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && ref.trim()) {
    const code = ref.trim().toUpperCase();
    window.localStorage.setItem(KEY, code);
    setCookie(code);
  }
}

export function getStoredReferral(): string {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem(KEY) ||
    window.localStorage.getItem(LEGACY_KEY) ||
    readCookie() ||
    ""
  );
}

export function clearStoredReferral() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(LEGACY_KEY);
  document.cookie = `${KEY}=; path=/; max-age=0; SameSite=Lax`;
}
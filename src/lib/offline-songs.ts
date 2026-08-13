/** Cache local das cifras para abrir mesmo sem internet. */
const KEY = "cifrastop:offline-songs";

export type OfflineSong = {
  id: string;
  title: string;
  artist: string;
  key: string;
  capo: string;
  body: string;
  media_url?: string | null;
  bpm?: number | null;
};

export function readOfflineSongs(): OfflineSong[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as OfflineSong[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfflineSongs(songs: OfflineSong[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(songs.slice(0, 300)));
  } catch {
    /* armazenamento cheio: mantém o app funcionando */
  }
}

export function cacheOfflineSong(song: OfflineSong) {
  const list = readOfflineSongs().filter((item) => item.id !== song.id);
  saveOfflineSongs([song, ...list]);
}

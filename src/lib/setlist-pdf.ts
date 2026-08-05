type SetlistSong = { title: string; artist?: string; key?: string; capo?: string; body?: string };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Abre a janela de impressão do navegador com o setlist formatado (salvar como PDF). */
export function exportSetlistPdf(songs: SetlistSong[], withBody = true) {
  const win = window.open("", "_blank", "noopener,width=900,height=1000");
  if (!win) return false;

  const index = songs
    .map(
      (song, i) =>
        `<li>${escapeHtml(song.title)}${song.artist ? ` — <em>${escapeHtml(song.artist)}</em>` : ""}${
          song.key ? ` <span class="tag">Tom ${escapeHtml(song.key)}</span>` : ""
        }${song.capo && song.capo !== "Sem Capo" ? ` <span class="tag">${escapeHtml(song.capo)}</span>` : ""}<span class="num">${i + 1}</span></li>`,
    )
    .join("");

  const bodies = withBody
    ? songs
        .map(
          (song) =>
            `<section><h2>${escapeHtml(song.title)}</h2><p class="meta">${escapeHtml(
              song.artist || "Sem artista",
            )} · Tom ${escapeHtml(song.key || "—")} · ${escapeHtml(song.capo || "Sem Capo")}</p><pre>${escapeHtml(
              song.body || "",
            )}</pre></section>`,
        )
        .join("")
    : "";

  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>Setlist — CifraStop</title>
<style>
  @page { margin: 14mm; }
  body { font-family: system-ui, sans-serif; color: #111; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #666; font-size: 12px; margin: 0 0 16px; }
  ol { padding-left: 18px; }
  li { margin-bottom: 6px; font-size: 14px; }
  .tag { background: #eee; border-radius: 4px; padding: 1px 5px; font-size: 11px; }
  .num { display: none; }
  section { page-break-before: always; }
  h2 { font-size: 17px; margin: 0 0 2px; }
  .meta { color: #666; font-size: 11px; margin: 0 0 10px; }
  pre { font-family: ui-monospace, monospace; font-size: 11.5px; line-height: 1.55; white-space: pre-wrap; }
</style></head><body>
<h1>Setlist — CifraStop</h1>
<p class="sub">${songs.length} música(s) · gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
<ol>${index}</ol>
${bodies}
</body></html>`);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 400);
  return true;
}
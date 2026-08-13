import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CifraWebResult = {
  title: string;
  artist: string;
  key: string;
  body: string;
  sourceUrl: string;
};

export type CifraWebOption = {
  title: string;
  artist: string;
  key: string;
  url: string;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCharCode(Number(code)));
}

function stripTags(html: string) {
  return decodeEntities(html.replace(/<[^>]*>/g, "")).trim();
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseCifraPage(html: string, sourceUrl: string): CifraWebResult | null {
  const pre = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (!pre) return null;

  const body = decodeEntities(
    pre[1]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?(b|span|a|i|u|em|strong)[^>]*>/gi, "")
      .replace(/<[^>]*>/g, ""),
  )
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (body.length < 40) return null;

  const titleMatch =
    html.match(/<h1[^>]*class="[^"]*t1[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const artistMatch = html.match(/<h2[^>]*class="[^"]*t3[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
  const keyMatch =
    html.match(/id="cifra_tom"[^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/tom:\s*<[^>]*>([^<]{1,4})</i);

  const slug = sourceUrl.split("/").filter(Boolean);
  const fallbackArtist = titleCase((slug[slug.length - 2] ?? "").replace(/-/g, " "));
  const fallbackTitle = titleCase((slug[slug.length - 1] ?? "").replace(/-/g, " "));

  return {
    title: (titleMatch ? stripTags(titleMatch[1]) : "") || fallbackTitle,
    artist: (artistMatch ? stripTags(artistMatch[1]) : "") || fallbackArtist,
    key: (keyMatch ? stripTags(keyMatch[1]) : "").slice(0, 4) || "C",
    body,
    sourceUrl,
  };
}

/** Lista as melhores opções encontradas para o termo digitado. */
export const buscarCifraOpcoes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ query: z.string().trim().min(2).max(120) }).parse(data),
  )
  .handler(async ({ data }): Promise<CifraWebOption[]> => {
    let payload: {
      response?: { docs?: { t?: string; dns?: string; url?: string; m?: string; a?: string }[] };
    } | null = null;
    try {
      const response = await fetch(
        `https://solr.sscdn.co/cifraclub/h/?q=${encodeURIComponent(data.query)}`,
        { headers: { "user-agent": UA, "accept-language": "pt-BR,pt;q=0.9" } },
      );
      if (response.ok) payload = await response.json();
    } catch {
      payload = null;
    }

    const docs = (payload?.response?.docs ?? []).filter(
      (item) => item.t === "2" && item.dns && item.url,
    );

    return docs.slice(0, 12).map((doc) => ({
      title: doc.m ? decodeEntities(doc.m) : titleCase((doc.url ?? "").replace(/-/g, " ")),
      artist: doc.a ? decodeEntities(doc.a) : titleCase((doc.dns ?? "").replace(/-/g, " ")),
      key: "",
      url: `https://www.cifraclub.com.br/${doc.dns}/${doc.url}/`,
    }));
  });

/** Abre uma opção escolhida e extrai título, artista, tom e a cifra completa. */
export const abrirCifraWeb = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ url: z.string().url().max(400) }).parse(data),
  )
  .handler(async ({ data }): Promise<CifraWebResult> => {
    if (!/^https:\/\/www\.cifraclub\.com\.br\//.test(data.url)) {
      throw new Error("Endereço de cifra inválido.");
    }
    let page: Response;
    try {
      page = await fetch(data.url, {
        headers: { "user-agent": UA, "accept-language": "pt-BR,pt;q=0.9" },
      });
    } catch {
      throw new Error("Não consegui abrir a página da cifra. Tente novamente.");
    }
    if (!page.ok) throw new Error("Não consegui abrir a página da cifra. Tente novamente.");

    const parsed = parseCifraPage(await page.text(), data.url);
    if (!parsed) throw new Error("Encontrei a página, mas não consegui extrair a cifra.");
    return parsed;
  });

/** Procura um vídeo de karaokê/playback no YouTube. */
export const buscarKaraoke = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ title: z.string().trim().min(1).max(160), artist: z.string().trim().max(160) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ videoId: string | null }> => {
    const query = `${data.title} ${data.artist} Karaokê Playback`.trim();
    try {
      const response = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        { headers: { "user-agent": UA, "accept-language": "pt-BR,pt;q=0.9" } },
      );
      if (!response.ok) return { videoId: null };
      const html = await response.text();
      const match = html.match(/"videoId":"([\w-]{11})"/);
      return { videoId: match ? match[1] : null };
    } catch {
      return { videoId: null };
    }
  });

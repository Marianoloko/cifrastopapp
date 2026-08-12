import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CifraWebResult = {
  title: string;
  artist: string;
  key: string;
  body: string;
  sourceUrl: string;
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

async function findCifraUrl(query: string): Promise<string | null> {
  const response = await fetch(
    `https://solr.sscdn.co/cifraclub/h/?q=${encodeURIComponent(query)}`,
    { headers: { "user-agent": UA, "accept-language": "pt-BR,pt;q=0.9" } },
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    response?: { docs?: { t?: string; dns?: string; url?: string }[] };
  };
  const doc = (payload.response?.docs ?? []).find(
    (item) => item.t === "2" && item.dns && item.url,
  );
  if (!doc) return null;
  return `https://www.cifraclub.com.br/${doc.dns}/${doc.url}/`;
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

  const titleCase = (value: string) =>
    value.replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export const buscarCifraWeb = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ query: z.string().trim().min(2).max(120) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<CifraWebResult> => {
    const logMiss = async () => {
      try {
        await context.supabase
          .from("search_misses")
          .insert({ query: data.query, user_id: context.userId });
      } catch {
        /* registro de falha é best-effort */
      }
    };

    let url: string | null = null;
    try {
      url = await findCifraUrl(data.query);
    } catch {
      url = null;
    }
    if (!url) {
      await logMiss();
      throw new Error("Não encontrei essa cifra na web. Tente com artista + nome da música.");
    }

    let page: Response;
    try {
      page = await fetch(url, { headers: { "user-agent": UA, "accept-language": "pt-BR,pt;q=0.9" } });
    } catch {
      await logMiss();
      throw new Error("Não consegui abrir a página da cifra. Tente novamente.");
    }
    if (!page.ok) {
      await logMiss();
      throw new Error("Não consegui abrir a página da cifra. Tente novamente.");
    }

    const parsed = parseCifraPage(await page.text(), url);
    if (!parsed) {
      await logMiss();
      throw new Error("Encontrei a página, mas não consegui extrair a cifra.");
    }
    return parsed;
  });

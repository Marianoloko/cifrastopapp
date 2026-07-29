import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  url: z.string().trim().url("Informe um link válido").max(500),
});

export type ImportedSong = {
  title: string;
  artist: string;
  key: string;
  capo: string;
  body: string;
};

export const importSongFromLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<ImportedSong> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Serviço de IA indisponível no momento.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você monta cifras para músicos em português do Brasil. A partir de um link (YouTube ou site de cifras), identifique a música e devolve uma cifra de estudo: título, artista, tom, capotraste e um corpo com marcações de seção entre colchetes ([Intro], [Primeira Parte], [Refrão]) e linhas de acordes. Nas linhas de acordes use apenas acordes (ex.: C  G  Am  F). Não reproduza a letra completa protegida por direitos autorais: escreva apenas a estrutura, os acordes e, no máximo, a primeira frase de cada seção como referência. Responda somente com JSON.",
          },
          {
            role: "user",
            content: `Link: ${data.url}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "cifra",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                artist: { type: "string" },
                key: { type: "string" },
                capo: { type: "string" },
                body: { type: "string" },
              },
              required: ["title", "artist", "key", "capo", "body"],
            },
          },
        },
      }),
    });

    if (response.status === 429) throw new Error("Muitas importações seguidas. Tente de novo em instantes.");
    if (response.status === 402) throw new Error("Créditos de IA esgotados no momento.");
    if (!response.ok) throw new Error("Não consegui importar essa música pelo link.");

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Não consegui importar essa música pelo link.");

    const parsed = JSON.parse(content) as ImportedSong;
    return {
      title: parsed.title ?? "",
      artist: parsed.artist ?? "",
      key: parsed.key || "C",
      capo: parsed.capo || "Sem Capo",
      body: parsed.body ?? "",
    };
  });
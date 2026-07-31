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
              [
                "Você monta cifras para músicos em português do Brasil a partir de um link de site de cifras.",
                "Devolva: título, artista, tom (só a tônica, ex.: C, G#, Bb), capotraste (ex.: 'Sem Capo' ou '2ª casa') e o corpo da cifra.",
                "FORMATO OBRIGATÓRIO DO CORPO (texto puro, monoespaçado):",
                "1. Cada seção começa com uma linha só com o nome entre colchetes: [Intro], [Primeira Parte], [Refrão], [Solo], [Final].",
                "2. Depois do nome da seção, uma linha em branco não é usada; as linhas seguintes alternam: linha de acordes, depois linha de referência.",
                "3. Linha de acordes contém APENAS acordes separados por dois ou mais espaços. Nunca misture acorde e texto na mesma linha.",
                "4. Deixe exatamente uma linha em branco entre seções.",
                "5. Não use markdown, tabelas, bullets, negrito, nem crase.",
                "6. Não reproduza a letra completa (direitos autorais): no máximo a primeira frase de cada seção como referência.",
                "Responda somente com JSON válido.",
              ].join("\n"),
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
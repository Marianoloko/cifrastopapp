import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

const inputSchema = z.object({
  tiktok: z.string().trim().max(60).default(""),
  instagram: z.string().trim().max(60).default(""),
  estilo: z.string().trim().min(1).max(60),
});

const strategySchema = z.object({
  diagnostico: z.string(),
  tendencias: z.array(z.string()).max(5),
  videos: z
    .array(
      z.object({
        titulo: z.string(),
        gancho: z.string(),
        roteiro: z.array(z.string()).max(6),
      }),
    )
    .max(3),
  hashtags: z.array(z.string()).max(20),
  legenda: z.string(),
});

export type MarketingStrategy = z.infer<typeof strategySchema>;

export const gerarEstrategia = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<MarketingStrategy> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("A IA não está configurada no momento.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const perfis = [
      data.tiktok ? `TikTok: @${data.tiktok.replace(/^@/, "")}` : "",
      data.instagram ? `Instagram: @${data.instagram.replace(/^@/, "")}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    try {
      const result = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        output: Output.object({ schema: strategySchema }),
        system:
          "Você é um estrategista de marketing musical brasileiro. Responda sempre em português do Brasil, com linguagem direta, prática e sem jargão. Os roteiros são para vídeos verticais de 15 segundos de um músico tocando/cantando usando o app CifraStop (cifras, transposição de tom, afinador, metrônomo, retorno de voz no fone).",
        prompt: `Perfis do músico: ${perfis || "sem perfis informados"}.
Estilo musical / nicho: ${data.estilo}.

Gere a estratégia de hoje:
1. diagnostico: análise curta (3 a 5 frases) do perfil e do nicho, com o que priorizar hoje.
2. tendencias: 3 a 5 tendências atuais para esse nicho musical no TikTok/Instagram.
3. videos: exatamente 3 ideias de vídeo viral de 15 segundos, cada uma com titulo, gancho (primeiros 2 segundos) e roteiro em 4 a 6 passos com marcação de tempo.
4. hashtags: 12 a 18 hashtags otimizadas para esse estilo (com #).
5. legenda: uma legenda pronta para postar, com CTA e emojis moderados.`,
      });

      return result.output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("429")) throw new Error("Muitas solicitações agora. Tente de novo em 1 minuto.");
      if (message.includes("402")) throw new Error("Os créditos de IA acabaram. Recarregue para continuar.");
      throw new Error("Não consegui gerar a estratégia agora. Tente novamente.");
    }
  });
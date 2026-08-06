import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

const inputSchema = z.object({
  objetivo: z.string().trim().min(3).max(300),
  nivel: z.string().trim().min(1).max(40),
  tempoDiario: z.string().trim().min(1).max(40),
  meta: z.string().trim().min(1).max(200),
});

const planoSchema = z.object({
  resumo: z.string(),
  duracaoSemanas: z.number(),
  semanas: z
    .array(
      z.object({
        titulo: z.string(),
        foco: z.string(),
        dias: z
          .array(
            z.object({
              dia: z.string(),
              atividades: z.array(z.string()).max(6),
            }),
          )
          .max(7),
      }),
    )
    .max(6),
  dicas: z.array(z.string()).max(6),
  musicasSugeridas: z
    .array(z.object({ titulo: z.string(), artista: z.string(), motivo: z.string() }))
    .max(6),
});

export type StudyPlan = z.infer<typeof planoSchema>;

export const gerarPlanoEstudo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<StudyPlan> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("A IA não está configurada no momento.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const result = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        output: Output.object({ schema: planoSchema }),
        system:
          "Você é um professor de música brasileiro que cria planos de estudo para iniciantes. Responda sempre em português do Brasil, com linguagem simples, acolhedora e sem jargão. O aluno usa o app CifraStop (cifras com transposição, afinador, metrônomo, gravador e retorno de voz) — cite essas ferramentas quando fizer sentido.",
        prompt: `O aluno quer aprender: ${data.objetivo}
Nível atual: ${data.nivel}
Tempo disponível por dia: ${data.tempoDiario}
Objetivo principal: ${data.meta}

Monte um plano de treino personalizado:
1. resumo: 2 a 4 frases explicando o caminho e o que ele vai conseguir tocar no fim.
2. duracaoSemanas: número de semanas do plano (entre 2 e 6).
3. semanas: uma entrada por semana, com titulo, foco e os dias de treino. Cada dia traz de 2 a 5 atividades curtas, com o tempo de cada uma somando exatamente o tempo diário informado (${data.tempoDiario}).
4. dicas: 3 a 5 dicas práticas para não desistir e evitar erros comuns nesse nível.
5. musicasSugeridas: 3 a 5 músicas brasileiras conhecidas compatíveis com o nível e com o objetivo, cada uma com titulo, artista e motivo (por que essa música ajuda nesse plano).`,
      });

      return result.output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("429")) throw new Error("Muitas solicitações agora. Tente de novo em 1 minuto.");
      if (message.includes("402")) throw new Error("Os créditos de IA acabaram. Recarregue para continuar.");
      throw new Error("Não consegui montar seu plano agora. Tente novamente.");
    }
  });

// src/lib/admin.functions.ts

import { supabase } from "@/integrations/supabase/client";

export async function activateUserSubscription(userId: string, planId: string, priceAmount: number, affiliateCode?: string) {
  // 1. Atualiza o status da assinatura do cliente para ATIVO
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 dias
      updated_at: new Date().toISOString()
    });

  if (subError) throw subError;

  // 2. CORREÇÃO: Registrar o valor da venda para contabilizar no painel/afiliados
  const { error: saleError } = await supabase
    .from('sales_history') // Ou o nome da sua tabela de vendas/afiliados
    .insert({
      user_id: userId,
      plan_id: planId,
      amount: priceAmount, // Ex: 15.00 ou 25.00
      affiliate_code: affiliateCode || null,
      created_at: new Date().toISOString()
    });

  if (saleError) {
    console.error("Erro ao contabilizar valor da venda:", saleError);
  }

  return { success: true };
}

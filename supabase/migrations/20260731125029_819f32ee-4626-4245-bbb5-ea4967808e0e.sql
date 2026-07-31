INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM public.profiles WHERE email = 'lgrandeharama@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_admin_to_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'lgrandeharama@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_admin_to_owner_trigger ON public.profiles;
CREATE TRIGGER grant_admin_to_owner_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_to_owner();

INSERT INTO public.plans (name, description, price_label, period_label, duration_days, badge, featured, whatsapp_message, features, active, sort_order)
VALUES (
  'Mais horas de teste',
  'Precisa de um pouco mais de tempo para avaliar o CifraStop? Solicite horas extras de teste grátis.',
  'Grátis',
  'horas extras de avaliação',
  1,
  'Teste grátis',
  false,
  'Olá! Gostaria de pedir mais algumas horas de teste grátis no CifraStop.',
  '["Pedido de horas extras sem custo","Liberação manual pela equipe","Acesso completo durante o período extra","Sem compromisso de assinatura"]'::jsonb,
  true,
  0
);
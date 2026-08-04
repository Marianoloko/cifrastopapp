import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; ref?: string } => ({
    redirect: search.redirect === "/admin" || search.redirect === "/app" ? search.redirect : undefined,
    ref: typeof search.ref === "string" && search.ref.trim() ? search.ref.trim().toUpperCase() : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — CifraStop" },
      { name: "description", content: "Acesse sua conta do CifraStop para abrir seu kit musical." },
      { property: "og:title", content: "Entrar — CifraStop" },
      { property: "og:description", content: "Faça login para acessar repertório, retorno, afinador, metrônomo e gravador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState(search.ref ?? "");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const destination = useMemo(() => search.redirect ?? "/app", [search.redirect]);

  useEffect(() => {
    if (search.ref) {
      setReferralCode(search.ref);
      setMode("signup");
    }
  }, [search.ref]);

  const applyReferral = async () => {
    const code = referralCode.trim();
    if (!code) return;
    try {
      const { data, error } = await supabase.rpc("apply_referral_code", { _code: code });
      if (error) return;
      const result = data as unknown as { ok: boolean; message: string } | null;
      if (result?.ok) setInfoMsg(result.message);
    } catch {
      // silencioso: o cadastro já foi concluído
    }
  };

  useEffect(() => {
    let cancelled = false;
    setCheckingSession(true);

    async function checkExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session) {
        setRedirecting(true);
        void navigate({ to: destination, replace: true });
        return;
      }

      setCheckingSession(false);
    }

    void checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, [destination, navigate]);

  const handleLogin = async (e: FormEvent) => {

    return handleSubmit(e);
  };

  const handleGoogle = async () => {
    if (googleLoading || loading || redirecting) return;
    setGoogleLoading(true);
    setErrorMsg(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErrorMsg("Não consegui entrar com o Google. Tente novamente.");
      setGoogleLoading(false);
      return;
    }
    if (result.redirected) return;
    setRedirecting(true);
    await navigate({ to: destination, replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || redirecting) return;

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (mode === "signup") {
        const phoneDigits = phone.replace(/\D/g, "");
        if (phoneDigits.length < 10) {
          setErrorMsg("Informe um WhatsApp válido com DDD (ex.: (98) 98715-0431).");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: fullName, phone: phoneDigits },
          },
        });

        if (error) {
          setErrorMsg(
            error.message.toLowerCase().includes("already")
              ? "Este e-mail já possui conta. Faça login."
              : "Não consegui criar sua conta. Verifique os dados e tente novamente.",
          );
          return;
        }

        if (data.session) {
          await supabase
            .from("profiles")
            .update({ phone: phoneDigits })
            .eq("id", data.session.user.id);
          await applyReferral();
          setRedirecting(true);
          await navigate({ to: destination, replace: true });
          return;
        }

        setInfoMsg("Conta criada! Confirme seu e-mail para começar o teste grátis de 4 horas.");
        setMode("login");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg("E-mail ou senha incorretos. Verifique seus dados.");
        return;
      }

      if (data.session) {
        await applyReferral();
        setRedirecting(true);
        await navigate({ to: destination, replace: true });
      }
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      setErrorMsg("Ocorreu um erro ao tentar entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CifraStop</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Digite suas credenciais para acessar a plataforma"
              : "Crie sua conta e teste grátis por 4 horas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={
                  mode === item
                    ? "rounded-md bg-card px-3 py-3 text-base font-bold text-card-foreground shadow-sm"
                    : "rounded-md px-3 py-3 text-base font-medium text-muted-foreground"
                }
              >
                {item === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="mb-4 h-14 w-full text-base font-bold"
            onClick={handleGoogle}
            disabled={googleLoading || loading || redirecting}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 size-5 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="mr-2 size-5" aria-hidden="true">
                <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
                <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H1.7v3C3.6 21.4 7.5 24 12 24z" />
                <path fill="#FBBC05" d="M5.5 14.6a7.2 7.2 0 0 1 0-4.6v-3H1.7a12 12 0 0 0 0 10.6l3.8-3z" />
                <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.6 2.6 1.7 6.4l3.8 3C6.4 6.7 9 4.8 12 4.8z" />
              </svg>
            )}
            Entrar com Google
          </Button>

          <div className="mb-4 flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou use seu e-mail
            <span className="h-px flex-1 bg-border" />
          </div>

          {checkingSession || redirecting ? (
            <div className="flex items-center justify-center rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Verificando acesso…
            </div>
          ) : null}
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {infoMsg && (
              <Alert>
                <AlertDescription>{infoMsg}</AlertDescription>
              </Alert>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp (com DDD)</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(98) 98715-0431"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  autoComplete="tel"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Usamos seu WhatsApp só para suporte e avisos da sua conta.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="h-12 text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12 text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="referralCode">Código de indicação (opcional)</Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="Ex.: A1B2C3D4"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Com um código válido você ganha 24 horas de acesso VIP.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="h-14 w-full text-base font-bold"
              disabled={loading || redirecting}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Entrando..." : "Criando conta..."}
                </>
              ) : (
                mode === "login" ? "Entrar" : "Criar conta e testar grátis"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

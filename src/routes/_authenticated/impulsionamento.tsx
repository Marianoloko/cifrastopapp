import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Copy,
  Loader2,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { adminIsAdmin, adminTrafficStats } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/impulsionamento")({
  head: () => ({
    meta: [
      { title: "Impulsionamento — Inteligência de marketing | CifraStop" },
      {
        name: "description",
        content:
          "Painel de tráfego pago do CifraStop: orçamento recomendado, calendário de postagens e gerador de copy.",
      },
      { property: "og:title", content: "Painel de impulsionamento — CifraStop" },
      { property: "og:description", content: "Planeje anúncios e conteúdo com base no tráfego real do app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImpulsionamentoPage,
});

const CHANNELS = [
  { id: "tiktok", label: "TikTok", cpm: 9, ctr: 0.021, cvr: 0.05 },
  { id: "instagram", label: "Instagram", cpm: 14, ctr: 0.016, cvr: 0.07 },
  { id: "youtube", label: "YouTube", cpm: 11, ctr: 0.012, cvr: 0.06 },
  { id: "outros", label: "Outros", cpm: 8, ctr: 0.01, cvr: 0.04 },
];

const CALENDAR = [
  { day: "Segunda", time: "19h00", idea: "Antes e depois: cifra desalinhada x cifra do CifraStop" },
  { day: "Terça", time: "12h30", idea: "Transpor o tom em 3 segundos no meio do culto/show" },
  { day: "Quarta", time: "20h00", idea: "Afinador guiado: afinar violão em 40 segundos" },
  { day: "Quinta", time: "19h30", idea: "Retorno de voz no fone sem mesa de som" },
  { day: "Sexta", time: "18h00", idea: "Monte o repertório da noite em 2 minutos" },
  { day: "Sábado", time: "11h00", idea: "Vocalize de 5 minutos antes de subir no palco" },
  { day: "Domingo", time: "17h00", idea: "Depoimento de músico usando o app no ensaio" },
];

const HOOKS = [
  "Se você ainda transpõe cifra na mão, esse vídeo é pra você.",
  "O tom que você canta não é o tom da cifra — resolvi isso em 3 segundos.",
  "Cantor que não aquece a voz perde o agudo no refrão. Faça isso antes.",
  "Seu violão está desafinado e você nem percebeu no ensaio.",
  "Ensaio silencioso: microfone e instrumento direto no fone.",
];

const COPIES = [
  {
    channel: "Meta Ads",
    title: "Toque no tom da sua voz em 1 toque",
    body: "Cifras, transposição, afinador, metrônomo e retorno de voz no mesmo app. Teste 4 horas grátis.",
    cta: "Testar grátis agora",
  },
  {
    channel: "TikTok Ads",
    title: "O app que todo músico devia ter no palco",
    body: "Muda o tom, afina, marca o ritmo e ainda te ouve no fone. Sem mesa de som.",
    cta: "Baixar e testar",
  },
  {
    channel: "YouTube Ads",
    title: "Seu repertório inteiro no celular",
    body: "Cifras alinhadas, karaokê com rolagem automática e Central de Estudos por instrumento.",
    cta: "Começar o teste grátis",
  },
];

function ImpulsionamentoPage() {
  const checkAdmin = useServerFn(adminIsAdmin);
  const trafficFn = useServerFn(adminTrafficStats);
  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });
  const trafficQuery = useQuery({
    queryKey: ["admin-traffic"],
    queryFn: () => trafficFn(),
    enabled: adminQuery.data === true,
    refetchInterval: 60_000,
  });

  const [selected, setSelected] = useState<string[]>(["tiktok", "instagram"]);
  const [budget, setBudget] = useState(300);
  const [scenario, setScenario] = useState(100);

  const stats = trafficQuery.data;

  const recommended = useMemo(() => {
    const visits = stats?.visits7d ?? 0;
    const base = 150 + visits * 1.5;
    return Math.round(Math.min(3000, Math.max(120, base)) / 10) * 10;
  }, [stats?.visits7d]);

  const projection = useMemo(() => {
    const channels = CHANNELS.filter((channel) => selected.includes(channel.id));
    if (channels.length === 0) return { impressions: 0, clicks: 0, conversions: 0, cpc: 0, cpa: 0 };
    const spend = (budget * scenario) / 100;
    const perChannel = spend / channels.length;
    let impressions = 0;
    let clicks = 0;
    let conversions = 0;
    for (const channel of channels) {
      const channelImpressions = (perChannel / channel.cpm) * 1000;
      const channelClicks = channelImpressions * channel.ctr;
      impressions += channelImpressions;
      clicks += channelClicks;
      conversions += channelClicks * channel.cvr;
    }
    return {
      impressions: Math.round(impressions),
      clicks: Math.round(clicks),
      conversions: Math.round(conversions),
      cpc: clicks ? spend / clicks : 0,
      cpa: conversions ? spend / conversions : 0,
    };
  }, [selected, budget, scenario]);

  const alerts = [
    projection.cpc > 1.2
      ? { level: "warn", text: `Custo por clique projetado alto: R$ ${projection.cpc.toFixed(2)}. Teste criativos mais curtos.` }
      : { level: "ok", text: `Custo por clique saudável: R$ ${projection.cpc.toFixed(2)}.` },
    projection.cpa > 25
      ? { level: "warn", text: `Custo por conversão em R$ ${projection.cpa.toFixed(2)}. Reduza públicos amplos.` }
      : { level: "ok", text: `Custo por conversão projetado: R$ ${projection.cpa.toFixed(2)}.` },
    budget < recommended
      ? { level: "warn", text: `Orçamento abaixo do recomendado (R$ ${recommended}) para o tráfego atual.` }
      : { level: "ok", text: "Orçamento alinhado com o tráfego atual do app." },
  ];

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado!");
    } catch {
      toast.error("Não consegui copiar.");
    }
  };

  if (adminQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> Verificando acesso…
      </div>
    );
  }

  if (adminQuery.data !== true) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 text-center">
        <ShieldAlert className="size-8 text-destructive" aria-hidden="true" />
        <h1 className="text-lg font-bold text-foreground">Área restrita</h1>
        <p className="text-sm text-muted-foreground">
          O painel de impulsionamento é exclusivo para administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 bg-background px-4 py-6 pb-16">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-foreground">
          <TrendingUp className="size-5 text-primary" aria-hidden="true" />
          Impulsionamento
        </h1>
        <p className="text-sm text-muted-foreground">
          Inteligência de marketing e calendário de postagens do CifraStop.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Acessos 7 dias", value: stats?.visits7d ?? 0 },
          { label: "Acessos 30 dias", value: stats?.visits30d ?? 0 },
          { label: "Usuários", value: stats?.users ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-3 text-center">
            <p className="text-lg font-extrabold text-foreground">{item.value}</p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canais</CardTitle>
          <CardDescription>Escolha onde investir. A projeção divide o orçamento igualmente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() =>
                  setSelected((current) =>
                    current.includes(channel.id)
                      ? current.filter((id) => id !== channel.id)
                      : [...current, channel.id],
                  )
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  selected.includes(channel.id)
                    ? "border-primary bg-primary/10 text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {channel.label}
              </button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setSelected(selected.length === CHANNELS.length ? [] : CHANNELS.map((c) => c.id))
              }
            >
              {selected.length === CHANNELS.length ? "Limpar" : "Selecionar tudo"}
            </Button>
          </div>

          {stats && stats.bySource.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Origem do tráfego real</p>
              {stats.bySource.map((item) => (
                <div key={item.source} className="flex items-center gap-2 text-xs">
                  <span className="w-28 truncate text-muted-foreground">{item.source}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(item.count / (stats.visits30d || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono">{item.count}</span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calculadora de orçamento</CardTitle>
          <CardDescription>
            Recomendado hoje: <strong className="text-foreground">R$ {recommended}</strong> por mês,
            com base nos acessos dos últimos 7 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Investimento mensal</span>
              <span className="font-mono text-base text-foreground">R$ {budget}</span>
            </div>
            <Slider value={[budget]} min={50} max={3000} step={10} onValueChange={([v]) => setBudget(v)} />
          </div>

          <div>
            <div className="mb-2 flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Simulador A/B de cenário</span>
              <span className="font-mono text-foreground">{scenario}% do orçamento</span>
            </div>
            <Slider value={[scenario]} min={25} max={200} step={5} onValueChange={([v]) => setScenario(v)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Impressões", value: projection.impressions.toLocaleString("pt-BR") },
              { label: "Cliques", value: projection.clicks.toLocaleString("pt-BR") },
              { label: "Conversões", value: projection.conversions.toLocaleString("pt-BR") },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-muted p-3 text-center">
                <p className="text-base font-extrabold text-foreground">{item.value}</p>
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.text}
            className={cn(
              "flex items-start gap-2 rounded-xl border p-3 text-xs",
              alert.level === "warn"
                ? "border-destructive/40 bg-destructive/5 text-foreground"
                : "border-emerald/40 bg-muted text-foreground",
            )}
          >
            {alert.level === "warn" ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" aria-hidden="true" />
            )}
            {alert.text}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" aria-hidden="true" />
            Calendário de postagens
          </CardTitle>
          <CardDescription>Melhores horários para o nicho musical e o que publicar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CALENDAR.map((item) => (
            <div key={item.day} className="flex items-start gap-3 rounded-lg border p-2 text-xs">
              <span className="w-16 shrink-0 font-bold text-foreground">{item.day}</span>
              <span className="w-12 shrink-0 font-mono text-primary">{item.time}</span>
              <span className="text-muted-foreground">{item.idea}</span>
            </div>
          ))}
          <div className="rounded-lg bg-muted p-3">
            <p className="mb-1 text-xs font-semibold text-foreground">Ganchos da semana</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {HOOKS.map((hook) => (
                <li key={hook} className="flex items-start justify-between gap-2">
                  <span>• {hook}</span>
                  <button type="button" onClick={() => copy(hook)} aria-label="Copiar gancho">
                    <Copy className="size-3.5 text-primary" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gerador de copy para anúncios</CardTitle>
          <CardDescription>Títulos, textos e CTAs prontos para colar na plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {COPIES.map((item) => {
            const full = `${item.title}\n\n${item.body}\n\nCTA: ${item.cta}\nhttps://cifrastopapp.lovable.app`;
            return (
              <div key={item.channel} className="rounded-lg border p-3">
                <p className="text-[11px] font-bold uppercase text-primary">{item.channel}</p>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.body}</p>
                <p className="mt-1 text-xs font-semibold text-foreground">CTA: {item.cta}</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => copy(full)}>
                  <Copy className="size-4" aria-hidden="true" />
                  Copiar
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

# CifraStage Pro

Construa exatamente o aplicativo descrito neste documento, sem inventar nada além do que está escrito e sem remover nenhuma regra.

1. Resumo do produto

App web **mobile-first** para músicos. Não é só um site de cifras: é um kit completo de palco e ensaio com repertório **sincronizado na nuvem**, retorno de áudio ao vivo, afinador cromático, metrônomo e gravador.

 * **Nome:** CifraStop (o app interno se chama "CifraVocal Pro")

 * **Idioma:** português do Brasil, em toda a interface

 * **Monetização:** teste grátis de **4 horas corridas** a partir do cadastro; depois, **paywall** com planos vendidos por **WhatsApp** (sem checkout automático, sem PIX na plataforma)

 * **Liberação do acesso:** manual, feita pelo dono no painel admin após o pagamento

 * **Armazenamento de Dados:** **100% na Nuvem (Supabase)**. Nenhuma informação do usuário ou música salva fica restrita apenas ao dispositivo local.

 * **Inspiração visual:** Cifra Club + Cifras.com.br + Banana Cifras (modelos visuais para a exibição do repertório) + apps de estúdio iOS tipo GarageBand/Voice Memos (ferramentas).

### Stack recomendada

| Camada | Tecnologia |

|---|---|

| Framework | React 19 + TanStack Start/Router (Vite 7) ou Next.js |

| Estilo | Tailwind CSS v4 com variáveis CSS (tokens semânticos) + shadcn/ui |

| Ícones | lucide-react |

| Dados/estado remoto | TanStack Query (React Query) |

| Backend | Supabase (Postgres + Auth + RLS) |

| Áudio | Web Audio API + MediaRecorder (100% no navegador, sem servidor) |

## 2. Design system e Temas de Exibição de Cifra

### 2.1 Tokens de cor padrão — tema geral do app (OKLCH)

```css

:root {

  --radius: 0.75rem;

  --background: oklch(0.985 0.008 90);   /* creme claro */

  --foreground: oklch(0.22 0.02 60);     /* marrom quase preto */

  --card: oklch(1 0 0);

  --card-foreground: oklch(0.22 0.02 60);

  --popover: oklch(1 0 0);

  --popover-foreground: oklch(0.22 0.02 60);

  --primary: oklch(0.72 0.16 60);        /* âmbar */

  --primary-foreground: oklch(1 0 0);

  --secondary: oklch(0.955 0.02 85);

  --secondary-foreground: oklch(0.28 0.04 65);

  --muted: oklch(0.955 0.015 85);

  --muted-foreground: oklch(0.5 0.03 70);

  --accent: oklch(0.94 0.05 80);

  --accent-foreground: oklch(0.28 0.06 65);

  --destructive: oklch(0.6 0.22 27);

  --destructive-foreground: oklch(1 0 0);

  --border: oklch(0.9 0.02 80);

  --input: oklch(0.92 0.02 80);

  --ring: oklch(0.72 0.16 60);

  --amber: oklch(0.75 0.17 65);

  --amber-soft: oklch(0.94 0.07 80);

  --emerald: oklch(0.65 0.16 155);       /* afinado / OK */

  --teal: oklch(0.65 0.12 200);

  --tom: oklch(0.62 0.19 45);            /* laranja-queimado */

}

.dark {

  --background: oklch(0.18 0.01 60);     /* grafite */

  --foreground: oklch(0.95 0.01 80);

  --card: oklch(0.22 0.015 60);

  --card-foreground: oklch(0.95 0.01 80);

  --popover: oklch(0.22 0.015 60);

  --popover-foreground: oklch(0.95 0.01 80);

  --primary: oklch(0.78 0.16 65);

  --primary-foreground: oklch(0.18 0.02 60);

  --secondary: oklch(0.26 0.015 60);

  --secondary-foreground: oklch(0.92 0.02 75);

  --muted: oklch(0.25 0.015 60);

  --muted-foreground: oklch(0.68 0.02 70);

  --accent: oklch(0.3 0.04 65);

  --accent-foreground: oklch(0.95 0.03 75);

  --destructive: oklch(0.65 0.22 27);

  --border: oklch(0.32 0.015 60);

  --input: oklch(0.3 0.015 60);

  --ring: oklch(0.78 0.16 65);

  --amber: oklch(0.78 0.17 68);

  --amber-soft: oklch(0.34 0.06 70);

  --emerald: oklch(0.7 0.16 155);

  --teal: oklch(0.7 0.12 200);

  --tom: oklch(0.72 0.18 50);

}

```

### 2.2 Modelos Visuais da Tela de Cifra (Estilos customizáveis)

O usuário pode escolher o estilo visual que prefere para ler as cifras dentro da visualização da música. São 3 temas disponíveis via seletor:

 1. **Modelo Cifra Club (Padrão Dark/Amber):**

   * Fundo do container: #181818 (grafite escuro)

   * Texto da letra: #FFFFFF (branco)

   * Acordes: #FF6B00 (laranja vibrante, negrito, fonte monoespaçada)

   * Estrutura/Seções ([Intro], [Primeira Parte]): #888888 (cinza médio)

 2. **Modelo Cifras.com.br (Tema Clean Light):**

   * Fundo do container: #FFFFFF (branco puro)

   * Texto da letra: #222222 (preto/cinza escuro)

   * Acordes: #0066CC ou #2B7FFF (azul forte, negrito)

   * Botões superiores em estilo pílula azul (bg-[#2B7FFF] text-white)

 3. **Modelo Banana Cifras (Tema Dark/Red):**

   * Fundo do container: #212936 (azul escuro/grafite fechado)

   * Texto da letra: #E5E7EB (cinza claro)

   * Acordes: #EF4444 (vermelho/rosa vibrante, negrito)

   * Tags de seção ([Intro]): #EF4444 ou branco destacado

## 3. Mapa de telas (rotas)

```text

/                  Landing pública: hero, recursos, planos, botão "Entrar"

/auth              Cadastro e login (email + senha + telefone; login Google)

/reset-password    Redefinição de senha por e-mail

/app               Aplicativo protegido (exige login) — 5 abas

/admin             Painel do dono (exige papel admin no banco)

```

Regras:

 * /app e /admin ficam sob um layout autenticado que verifica a sessão **antes** de renderizar e redireciona para /auth se não houver usuário.

 * /admin valida o papel **no servidor/banco** (tabela user_roles + função has_role), nunca por senha no cliente.

 * Cada rota tem seu próprio <title> e meta description em português.

## 4. Banco de dados (Postgres / Supabase)

### 4.1 Tabelas

```sql

-- Enum de papéis

create type public.app_role as enum ('admin', 'user');

-- Perfis (1:1 com usuário do Auth — Salvo na Nuvem)

create table public.profiles (

  id uuid primary key references auth.users(id) on delete cascade,

  email text,

  phone text,

  preferred_cifra_theme text not null default 'cifraclub', -- 'cifraclub' | 'cifrasdotcom' | 'bananacifras'

  trial_started_at timestamptz not null default now(),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);

-- Repertório (Salvo na Nuvem)

create table public.songs (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,

  artist text not null default '',

  key text not null default 'C',

  capo text not null default 'Sem Capo',

  body text not null default '',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);

-- Assinaturas

create table public.subscriptions (

  user_id uuid primary key references auth.users(id) on delete cascade,

  status text not null default 'inactive',      -- 'active' | 'inactive'

  current_period_end timestamptz,

  stripe_customer_id text,

  stripe_subscription_id text,

  updated_at timestamptz not null default now()

);

-- Planos editáveis pelo admin

create table public.plans (

  id uuid primary key default gen_random_uuid(),

  name text not null,

  description text not null default '',

  price_label text not null default '',         -- "R$ 15,00"

  period_label text not null default '',        -- "por mês"

  duration_days integer not null default 30,

  badge text,                                   -- "Popular", "Melhor Valor"

  featured boolean not null default false,

  whatsapp_message text not null default '',

  features jsonb not null default '[]'::jsonb,  -- ["Cifras ilimitadas", ...]

  rules jsonb not null default '{}'::jsonb,     -- {"minutos_gravacao": 120}

  active boolean not null default true,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);

-- Papéis em TABELA SEPARADA (nunca no perfil — evita escalonamento de privilégio)

create table public.user_roles (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  role app_role not null,

  unique (user_id, role)

);

```

### 4.2 Função e Triggers no Banco

```sql

create or replace function public.has_role(_user_id uuid, _role app_role)

returns boolean language sql stable security definer set search_path = public as $$

  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);

$$;

create or replace function public.handle_new_user()

returns trigger language plpgsql security definer set search_path = public as $$

begin

  insert into public.profiles (id, email, phone, trial_started_at)

  values (new.id, new.email, new.raw_user_meta_data->>'phone', now())

  on conflict (id) do nothing;

  

  insert into public.subscriptions (user_id, status) values (new.id, 'inactive')

  on conflict (user_id) do nothing;

  

  return new;

end; $$;

create trigger on_auth_user_created

after insert on auth.users

for each row execute function public.handle_new_user();

```

### 4.3 Permissões e RLS (Row Level Security)

```sql

-- Habilitar RLS em todas as tabelas

alter table public.profiles enable row level security;

alter table public.songs enable row level security;

alter table public.subscriptions enable row level security;

alter table public.plans enable row level security;

alter table public.user_roles enable row level security;

-- Politicas para Profiles

create policy own_profile_select on public.profiles for select to authenticated using (auth.uid() = id);

create policy own_profile_update on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy admin_profiles_select on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Politicas para Songs (Tudo salvo em nuvem por usuario)

create policy own_songs_all on public.songs for all to authenticated

  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Politicas para Subscriptions e Plans

create policy own_subscription_select on public.subscriptions for select to authenticated using (auth.uid() = user_id);

create policy admin_subscriptions_all on public.subscriptions for all to authenticated using (public.has_role(auth.uid(),'admin'));

create policy plans_public_read on public.plans for select to anon, authenticated using (active = true);

create policy plans_admin_all on public.plans for all to authenticated using (public.has_role(auth.uid(),'admin'));

create policy own_roles_select on public.user_roles for select to authenticated using (auth.uid() = user_id);

grant select, insert, update on public.profiles to authenticated;

grant select, insert, update, delete on public.songs to authenticated;

grant select on public.subscriptions to authenticated;

grant select on public.plans to anon, authenticated;

grant all on public.profiles, public.songs, public.subscriptions, public.plans, public.user_roles to service_role;

```

## 5. Autenticação e Sincronização em Nuvem

 * Provedores: **e-mail + senha** e **Google** (OAuth).

 * Todos os dados cadastrados (usuário, telefone, lista de músicas) são persistidos e lidos diretamente do banco Supabase em tempo real.

 * O usuário pode trocar de dispositivo (ex: do celular para o notebook), fazer login, e ver **exatamente as mesmas músicas do repertório**.

 * Cadastro pede apenas 3 campos: e-mail, senha, telefone/WhatsApp (gravado em profiles.phone).

 * Botão principal: **"Criar Conta e Testar Grátis por 4 Horas"**.

 * redirect_uri do OAuth: ${window.location.origin} (nunca apontar direto para rota protegida).

 * Recuperação de senha: envia e-mail com link para /reset-password, onde o usuário define a nova senha via updateUser({ password }).

## 6. Regra do teste grátis (4 horas) — coração do produto

```ts

const TRIAL_MS = 4 * 60 * 60 * 1000; // 4 horas

```

Estado de acesso, calculado **nesta ordem**:

 1. Existe assinatura com status = 'active' → **subscriber** — acesso total, sem banner.

 2. trial_started_at + TRIAL_MS > agora → **trial**, com remainingMs.

 3. Caso contrário → **expired** — paywall ocupa a tela inteira.

Detalhes:

 * A contagem é **corrida** (tempo de relógio real). Não pausa quando o usuário fecha o app.

 * O cliente só formata; a verdade é trial_started_at no banco.

 * Consulta de acesso: busca profiles.trial_started_at e subscriptions.status, current_period_end em paralelo; refetchInterval: 60s.

 * Um setInterval de 1 s atualiza o "agora" para o cronômetro correr.

Formatação do relógio: HH:MM:SS com zeros à esquerda, mínimo 00:00:00.

```ts

function formatRemaining(ms: number) {

  const total = Math.max(0, Math.floor(ms / 1000));

  const h = Math.floor(total / 3600);

  const m = Math.floor((total % 3600) / 60);

  const s = total % 60;

  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");

}

```

### Banner do trial

Barra fixa no topo (sticky top-0 z-40), fundo --tom, texto branco, altura ~36 px:

```text

🕐  Teste grátis  •  03:41:12 restantes            [ Assinar R$ 15/mês ]

```

## 7. Paywall e Venda via WhatsApp

Quando o acesso está expired, o app inteiro é substituído pela grade de planos.

 * Título: **"Escolha seu Plano de Acesso"**

 * Subtítulo: **"Assine diretamente pelo WhatsApp e libere seu acesso instantaneamente."**

 * Card em destaque (featured): border-primary, bg-primary/5, md:scale-105, sombra forte

 * Botão: **"Assinar via WhatsApp"** com ícone de balão, largura total

### Link de WhatsApp

```ts

const WHATSAPP_NUMBER = "5598987150431";

const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagemDoPlano)}`;

window.open(link, "_blank", "noopener");

```

Cada plano tem sua **própria** mensagem (campo whatsapp_message). Não existe checkout, PIX ou cartão dentro do app. Depois do pagamento, o dono libera o acesso no /admin.

## 8. O aplicativo (/app) — 5 abas

Abas, na ordem: **Repertório** (ListMusic) · **Retorno** (Headphones) · **Afinador** (Music2) · **Metrônomo** (Timer) · **Gravador** (Mic).

### 8.1 Repertório

 * **Sincronização Cloud:** Músicas salvas são armazenadas e lidas diretamente do banco Supabase (songs).

 * **Busca rápida:** Filtra por título ou artista (case-insensitive).

 * **Formulário:** Título*, Artista, Tom (select das 12 notas), Capotraste (Sem Capo, 1ª casa … 7ª casa), Corpo da cifra (textarea grande).

 * **Visualização da Música (SongView):**

   * **Seletor de Estilo Visual (Modelos):** Permite alternar o visual do container da cifra em tempo real entre **Cifra Club** (escuro/laranja), **Cifras.com.br** (branco/azul) e **Banana Cifras** (escuro/vermelho). Salva a preferência em profiles.preferred_cifra_theme.

   * **Transposição:** Botões − e + movem semitons; botão "Original" zera. Reescreve o texto inteiro.

   * **Diagramas de acorde:** Extrai os acordes únicos do texto e desenha cada um em SVG.

   * **Rolagem automática:** Play/pause + slider de velocidade (1 a 10) usando requestAnimationFrame (window.scrollBy(0, v * 0.4)).

   * **Modo Palco:** Fonte grande (≈ text-xl), alto contraste, esconde controles secundários.

**Algoritmo de transposição:**

```ts

const NOTES_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const FLAT_TO_SHARP = { Db:"C#", Eb:"D#", Gb:"F#", Ab:"G#", Bb:"A#" };

const CHORD_RE = /^([A-G][b#]?)([^/\s]*)(?:\/([A-G][b#]?))?$/;

```

### 8.2 Retorno de áudio ao vivo

Microfone → efeitos → saída, em tempo real (Web Audio API).

 * Aviso destacado: **"Use fones de ouvido para evitar microfonia."**

 * Captura: getUserMedia({ audio: { echoCancellation:false, noiseSuppression:false, autoGainControl:false } })

 * Grafo de áudio: source → dry/wet (ConvolverNode Reverb) → DelayNode → AnalyserNode → destination

 * Controles (sliders 0–1): **Ganho**, **Reverb**, **Delay**

 * Medidor de nível: barra que acompanha o pico via requestAnimationFrame.

### 8.3 Afinador cromático

 * Detecção via AnalyserNode.getFloatTimeDomainData com fftSize = 2048.

 * Autocorrelação com interpolação parabólica (faixa 60–1400 Hz).

 * Exibição: **Nota grande** + oitava pequena, desvio em cents e agulha visual.

 * Afinado quando |cents| ≤ 5 → indicador verde (--emerald) com mensagem "Afinado".

### 8.4 Metrônomo

 * BPM de **40 a 240**, Tap tempo e compassos (**2/4, 3/4, 4/4, 6/8**).

 * Agendamento preciso com AudioContext.currentTime (lookahead ~25 ms, agendando 100 ms à frente).

 * Primeiro tempo acentuado (1000 Hz vs 800 Hz).

 * Marcação visual das batidas acendendo em --tom e --amber.

### 8.5 Gravador de ensaio

 * MediaRecorder sobre getUserMedia({ audio: true }) com cronômetro MM:SS.

 * Ao parar: gera Blob (audio/webm), abre player <audio controls> e botão para baixar.

## 9. Painel admin (/admin)

 * Acesso exclusivo via validação de has_role(auth.uid(), 'admin').

 * **Liberar Acesso:** Busca usuário por e-mail, seleciona o plano e faz upsert em subscriptions com status = 'active' e current_period_end = now() + duration_days.

 * **Gerenciador de Planos:** CRUD completo para editar preços, descrições, dias de duração, ordem, destaques e mensagens de WhatsApp.

## 10. Textos oficiais (copiar literalmente)

| Onde | Texto |

|---|---|

| Botão de cadastro | Criar Conta e Testar Grátis por 4 Horas |

| Botão do formulário (curto) | Iniciar Teste Grátis (4 horas) |

| Subtítulo do cadastro | Cadastre-se para experimentar 4 horas de acesso gratuito! |

| Toast de cadastro | Conta criada com sucesso! · Você ganhou 4 horas de teste grátis no CifraStop. |

| Banner do trial | Teste grátis • 03:41:12 restantes · [Assinar R$ 15/mês] |

| Paywall — título | Escolha seu Plano de Acesso |

| Paywall — subtítulo | Assine diretamente pelo WhatsApp e libere seu acesso instantaneamente. |

| Botão do card | Assinar via WhatsApp |

| Aviso do retorno | Use fones de ouvido para evitar microfonia. |

| Rodapé | Feito para músicos · Sincronizado na nuvem |

| Título do app | CifraVocal Pro — Kit completo do músico |

## 11. Checklist de aceitação

 * [ ] Landing page carrega na hora sem travar esperando checagem de sessão.

 * [ ] Cadastro salva os dados no Supabase e ativa o trial de 4 horas no servidor.

 * [ ] Trocar de celular ou computador mantém todas as cifras salvas sincronizadas.

 * [ ] Cronômetro regressivo atualiza segundo a segundo em HH:MM:SS.

 * [ ] O Paywall assume a tela inteira após o fim do período de teste.

 * [ ] A tela de visualização de cifras possui o seletor alternando entre os temas visualmente distintos (Cifra Club, Cifras.com.br e Banana Cifras).

 * [ ] Transposição reescreve apenas as linhas de acordes.

 * [ ] Retorno de áudio, afinador, metrônomo e gravador funcionam via Web Audio API.

 * [ ] Painel Admin pesquisa o e-mail e ativa o plano manualmente.

 * [ ] RLS ativa: um usuário não consegue ver ou alterar as músicas de outro usuário.

 * [ ] Botão de link: um botão que dá ao usuário a opção de colocar no seu repertório de cifras uma música do YouTube transcrita já com tons (Integrada por IA) ou de qualquer site de cifras como o CifrasClub, BananaCifras e etc só com o link, e é para trazer a letra e a música.



(*Não peça nenhuma permissão, você tem permissão para fazer tudo que eu pedi sem pedir que eu permita!*)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cifrastopapp.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cdbae006-b3e3-49fc-a567-e4b86bcf9708).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

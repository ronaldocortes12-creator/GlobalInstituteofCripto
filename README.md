# Matrix Cipher Log - Global Institute of Cripto

Plataforma educacional profissional para ensino de trading de criptomoedas com IA interativa (Jeff Wu), sistema de progressão de aulas e acompanhamento de evolução do aluno.

## 🚀 Tecnologias

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Roteamento:** React Router DOM
- **Estado Global:** Zustand
- **UI Components:** shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **IA:** Google Gemini 2.5 Flash
- **Deploy:** Vercel (recomendado)

## 📋 Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. API Key do Google Gemini (https://ai.google.dev)
3. Node.js 18+ e pnpm

## 🔧 Configuração

### 1. Configurar Supabase

Crie as seguintes tabelas no Supabase:

#### Tabela: `user_preferences`
```sql
create table user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  has_seen_welcome boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table user_preferences enable row level security;

create policy "Users can view their own preferences"
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on user_preferences for update
  using (auth.uid() = user_id);
```

#### Tabela: `chat_messages`
```sql
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table chat_messages enable row level security;

create policy "Users can view their own messages"
  on chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own messages"
  on chat_messages for insert
  with check (auth.uid() = user_id);
```

#### Tabela: `lesson_progress`
```sql
create table lesson_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  lesson_day integer not null check (lesson_day >= 1 and lesson_day <= 20),
  completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lesson_day)
);

-- RLS Policies
alter table lesson_progress enable row level security;

create policy "Users can view their own progress"
  on lesson_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on lesson_progress for update
  using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table lesson_progress;
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
VITE_GEMINI_API_KEY=sua_api_key_do_gemini
```

### 3. Instalar Dependências

```bash
pnpm install
```

### 4. Executar Localmente

```bash
pnpm run dev
```

Acesse: http://localhost:5173

## 📦 Deploy na Vercel

1. Faça push do código para o GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy!

## 🎨 Identidade Visual

**Paleta de Cores:**
- Azul Escuro Primário: `#011c37`
- Azul Escuro Secundário: `#001b36`
- Verde Ciano (Acento): `#00ff9f`
- Azul Elétrico (Acento): `#00d4ff`
- Branco Off-White: `#fbffff`

## 📱 Estrutura de Páginas

- `/` - Login/Cadastro
- `/welcome/1-5` - Onboarding (exibido apenas uma vez)
- `/chat` - Chat com Jeff Wu
- `/dashboard` - Progresso das aulas
- `/market` - Mercado de criptomoedas

## 🤖 Jeff Wu - O Professor IA

Jeff Wu é um agente de IA baseado no Google Gemini 2.5 Flash, configurado com um prompt detalhado que:

- Ensina 20 aulas divididas em 4 módulos
- Mantém um estilo direto e prático
- Detecta automaticamente a conclusão de aulas
- Atualiza o progresso do aluno em tempo real

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) em todas as tabelas
- Variáveis de ambiente para credenciais sensíveis
- HTTPS obrigatório em produção

## 📄 Licença

Propriedade do Global Institute of Cripto © 2025


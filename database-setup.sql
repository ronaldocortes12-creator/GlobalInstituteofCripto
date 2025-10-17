-- ============================================
-- MATRIX CIPHER LOG - DATABASE SETUP
-- Global Institute of Cripto
-- ============================================

-- ============================================
-- 1. TABELA: user_preferences
-- ============================================
create table if not exists user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  has_seen_welcome boolean default false,
  name text,
  age integer,
  crypto_experience text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies para user_preferences
alter table user_preferences enable row level security;

drop policy if exists "Users can view their own preferences" on user_preferences;
create policy "Users can view their own preferences"
  on user_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own preferences" on user_preferences;
create policy "Users can insert their own preferences"
  on user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own preferences" on user_preferences;
create policy "Users can update their own preferences"
  on user_preferences for update
  using (auth.uid() = user_id);

-- ============================================
-- 2. TABELA: chat_messages
-- ============================================
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lesson_day integer default 1,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índice para melhor performance
create index if not exists chat_messages_user_id_idx on chat_messages(user_id);
create index if not exists chat_messages_created_at_idx on chat_messages(created_at);

-- RLS Policies para chat_messages
alter table chat_messages enable row level security;

drop policy if exists "Users can view their own messages" on chat_messages;
create policy "Users can view their own messages"
  on chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own messages" on chat_messages;
create policy "Users can insert their own messages"
  on chat_messages for insert
  with check (auth.uid() = user_id);

-- ============================================
-- 3. TABELA: lesson_progress
-- ============================================
create table if not exists lesson_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lesson_day integer not null check (lesson_day >= 1 and lesson_day <= 20),
  completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_lesson unique(user_id, lesson_day)
);

-- Índice para melhor performance
create index if not exists lesson_progress_user_id_idx on lesson_progress(user_id);
create index if not exists lesson_progress_lesson_day_idx on lesson_progress(lesson_day);

-- RLS Policies para lesson_progress
alter table lesson_progress enable row level security;

drop policy if exists "Users can view their own progress" on lesson_progress;
create policy "Users can view their own progress"
  on lesson_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own progress" on lesson_progress;
create policy "Users can insert their own progress"
  on lesson_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on lesson_progress;
create policy "Users can update their own progress"
  on lesson_progress for update
  using (auth.uid() = user_id);

-- ============================================
-- 4. HABILITAR REALTIME
-- ============================================
-- Habilitar Realtime para lesson_progress (atualização em tempo real do dashboard)
alter publication supabase_realtime add table lesson_progress;

-- ============================================
-- 5. FUNÇÃO PARA AUTO-ATUALIZAR updated_at
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger para user_preferences
drop trigger if exists update_user_preferences_updated_at on user_preferences;
create trigger update_user_preferences_updated_at
  before update on user_preferences
  for each row
  execute function update_updated_at_column();

-- ============================================
-- 6. CONFIGURAÇÃO DE AUTENTICAÇÃO
-- ============================================
-- No painel do Supabase, configure:
-- 1. Authentication > Settings > Email Auth > Enable email confirmations: OFF (auto-confirm)
-- 2. Authentication > Settings > Email Auth > Enable sign ups: ON

-- ============================================
-- FIM DO SETUP
-- ============================================


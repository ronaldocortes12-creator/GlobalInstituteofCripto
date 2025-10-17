# Arquitetura Técnica - Matrix Cipher Log

## Visão Geral do Sistema

O **Matrix Cipher Log** é uma plataforma educacional robusta e escalável para ensino de trading de criptomoedas, construída com as melhores práticas de desenvolvimento web moderno.

## Arquitetura de Software

### Stack Tecnológico

**Frontend:**
- React 19 (framework UI)
- Vite (build tool e dev server)
- Tailwind CSS (estilização)
- shadcn/ui (componentes UI)
- React Router DOM (roteamento)
- Zustand (gerenciamento de estado)
- React Hot Toast (notificações)

**Backend:**
- Supabase (BaaS - Backend as a Service)
  - PostgreSQL (banco de dados relacional)
  - Supabase Auth (autenticação)
  - Realtime (atualizações em tempo real)
  - Row Level Security (segurança)

**IA:**
- Google Gemini 2.5 Flash (modelo de linguagem)
- Vercel Edge Functions (serverless para streaming)

**Deploy:**
- Vercel (frontend + edge functions)
- Supabase Cloud (backend + database)

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React App (Vite)                                     │   │
│  │  ├── Pages (Login, Welcome, Chat, Dashboard, Market) │   │
│  │  ├── Components (UI, MatrixRain, TabBar)             │   │
│  │  ├── State Management (Zustand)                      │   │
│  │  └── Routing (React Router)                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE FUNCTIONS                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/chat                                            │   │
│  │  └── Streaming de respostas do Gemini                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Call
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    GOOGLE GEMINI API                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Gemini 2.5 Flash                                     │   │
│  │  └── Jeff Wu (Professor IA)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                  │   │
│  │  ├── user_preferences                                 │   │
│  │  ├── chat_messages                                    │   │
│  │  └── lesson_progress (Realtime enabled)              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Supabase Auth                                        │   │
│  │  └── JWT-based authentication                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Realtime Subscriptions                               │   │
│  │  └── WebSocket para atualizações instantâneas        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Estrutura do Banco de Dados

### Modelo de Dados

```
┌─────────────────────┐
│    auth.users       │ (Supabase Auth)
│  ─────────────────  │
│  id (PK)            │
│  email              │
│  created_at         │
└──────────┬──────────┘
           │
           │ 1:1
           ▼
┌─────────────────────┐
│ user_preferences    │
│  ─────────────────  │
│  id (PK)            │
│  user_id (FK)       │
│  has_seen_welcome   │
│  created_at         │
│  updated_at         │
└─────────────────────┘

           │ 1:N
           ▼
┌─────────────────────┐
│  chat_messages      │
│  ─────────────────  │
│  id (PK)            │
│  user_id (FK)       │
│  role               │
│  content            │
│  created_at         │
└─────────────────────┘

           │ 1:N
           ▼
┌─────────────────────┐
│  lesson_progress    │ (Realtime)
│  ─────────────────  │
│  id (PK)            │
│  user_id (FK)       │
│  lesson_day         │
│  completed          │
│  completed_at       │
│  created_at         │
└─────────────────────┘
```

## Fluxos de Dados Principais

### 1. Fluxo de Autenticação

```
Usuário → Login Page → Supabase Auth
                            │
                            ▼
                    JWT Token gerado
                            │
                            ▼
                    Verifica has_seen_welcome
                            │
                    ┌───────┴───────┐
                    │               │
                 true            false
                    │               │
                    ▼               ▼
                 /chat         /welcome/1
```

### 2. Fluxo de Chat com Jeff Wu

```
Usuário digita mensagem
        │
        ▼
Salva no Supabase (chat_messages)
        │
        ▼
Envia para /api/chat (Edge Function)
        │
        ▼
Edge Function → Gemini API (streaming)
        │
        ▼
Resposta em stream → Frontend
        │
        ▼
Detecta conclusão de aula?
        │
    ┌───┴───┐
    │       │
   Sim     Não
    │       │
    ▼       ▼
Atualiza  Apenas
lesson_   exibe
progress  resposta
    │
    ▼
Dashboard atualiza (Realtime)
```

### 3. Fluxo de Progresso em Tempo Real

```
Jeff Wu conclui aula
        │
        ▼
Frontend detecta padrão "Dia X concluído"
        │
        ▼
Atualiza lesson_progress (Supabase)
        │
        ▼
Supabase Realtime notifica
        │
        ▼
Dashboard recebe evento
        │
        ▼
UI atualiza instantaneamente
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS que garantem que:
- Usuários só podem ver seus próprios dados
- Usuários só podem inserir dados associados ao seu user_id
- Usuários só podem atualizar seus próprios registros

### Autenticação

- JWT tokens gerenciados pelo Supabase Auth
- Tokens armazenados em localStorage (persistência de sessão)
- Auto-refresh de tokens
- Proteção de rotas no frontend (ProtectedRoute component)

### Variáveis de Ambiente

Credenciais sensíveis nunca são commitadas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

## Performance e Escalabilidade

### Frontend

- **Code Splitting:** React Router lazy loading (futuro)
- **Otimização de Bundle:** Vite tree-shaking
- **Caching:** Service Workers (futuro)
- **CDN:** Vercel Edge Network

### Backend

- **Database Indexing:** Índices em user_id e created_at
- **Connection Pooling:** Supabase gerencia automaticamente
- **Realtime Optimization:** Apenas tabela lesson_progress habilitada

### IA

- **Streaming:** Respostas em tempo real (melhor UX)
- **Edge Functions:** Execução próxima ao usuário
- **Rate Limiting:** Implementar no futuro

## Responsividade

Design mobile-first com breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

Componentes otimizados:
- TabBar fixo no mobile
- Chat interface adaptativa
- Dashboard com cards responsivos

## Monitoramento e Logs

### Atual
- Console.error para debugging
- Toast notifications para feedback ao usuário

### Futuro (Recomendado)
- Sentry para error tracking
- Vercel Analytics para métricas
- Supabase Logs para auditoria

## Roadmap de Melhorias

### Curto Prazo
1. ✅ Sistema de autenticação
2. ✅ Chat com Jeff Wu
3. ✅ Dashboard de progresso
4. ✅ Realtime updates
5. ⏳ Testes automatizados
6. ⏳ Deploy na Vercel

### Médio Prazo
1. Integração com Stripe (pagamentos)
2. Sistema de e-mails transacionais
3. Página de Market com dados reais (APIs de exchanges)
4. Sistema de notificações push
5. Modo offline (PWA)

### Longo Prazo
1. App mobile nativo (React Native)
2. Sistema de gamificação
3. Comunidade/fórum de alunos
4. Análise de sentimento do mercado
5. Integração com exchanges (Bitget, Binance)

## Estimativa de Custos Mensais

**Supabase (Free Tier):**
- 500MB database
- 2GB bandwidth
- 50.000 monthly active users
- **Custo: $0/mês** (até atingir limites)

**Vercel (Hobby Plan):**
- 100GB bandwidth
- Serverless functions ilimitadas
- **Custo: $0/mês**

**Google Gemini API:**
- Depende do uso
- ~$0.00025 por 1K tokens
- Estimativa: **$10-50/mês** (dependendo do volume)

**Total Estimado: $10-50/mês** (fase inicial)

## Conclusão

Esta arquitetura foi projetada para ser:
- **Robusta:** Tratamento de erros e segurança em todas as camadas
- **Escalável:** Pode crescer de 10 a 10.000 usuários sem mudanças significativas
- **Rápida:** Edge functions, CDN e otimizações de performance
- **Econômica:** Uso de tier gratuito e serverless para minimizar custos
- **Moderna:** Stack tecnológico atual e melhores práticas

O sistema está pronto para ser deployado e começar a receber usuários reais.


# YouAgent App — Handoff de Desenvolvimento

> Documento de contexto do React app. Abrir no início de cada sessão para retomar sem perda de contexto.
> Atualizar sempre que uma página for concluída.

---

## Visão geral do projeto

**YouAgent** — plataforma SaaS B2B de agentes de voz IA para agendamento comercial ativo.

**Stack React:**
- React 18 + Vite + TypeScript
- Tailwind CSS v3 (tema claro/branco)
- Zustand (estado global com `persist`)
- TanStack React Query (dados)
- React Router DOM v6
- Axios (HTTP client com interceptor JWT)
- Lucide React (ícones)
- clsx (classes condicionais)

**Backend:** Node.js + Express no Railway → `https://app.etztech.com/api/v1`  
**Banco:** Supabase (PostgreSQL com RLS)  
**Voz:** 100% Telnyx (número +55-11-5108-6178/79 aguardando aprovação)  
**Fontes:** Sora (UI) + DM Mono (métricas) via Google Fonts CDN

**Protótipo fonte da verdade:** `C:\Users\vicen\OneDrive\Área de Trabalho\voxagent\prototype\voxagent.html`
> ⚠️ SEMPRE ler a seção correspondente do protótipo antes de construir uma página nova.

---

## Regras críticas de desenvolvimento

1. **Antes de qualquer página nova:** ler a seção `#pg-nome` no protótipo HTML para não perder nenhuma função
2. **Tailwind v3:** nunca usar modificadores de opacidade (`/12`) dentro de `@apply` em `@layer components` — usar `rgba()` puro
3. **Auth:** backend retorna `{ token, cliente }` — NÃO `{ jwt, cliente }`
4. **ProtectedRoute:** checar `localStorage.getItem('youagent_jwt')` diretamente (não esperar Zustand hidratar)
5. **Alias `@`** → `./src` configurado em `vite.config.ts` e `tsconfig`

---

## Estrutura do projeto

```
youagent-app/
├── src/
│   ├── App.tsx                          ✅ Rotas configuradas
│   ├── index.css                        ✅ Tema claro completo
│   ├── main.tsx
│   ├── store/
│   │   └── authStore.ts                 ✅ Zustand + persist
│   ├── services/
│   │   └── api.ts                       ✅ Axios + interceptor JWT
│   ├── types/
│   │   ├── campanha.ts                  ✅
│   │   └── discadora.ts                 ✅
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx            ✅ Sidebar colapsável + topbar
│   │   │   └── ProtectedRoute.tsx       ✅
│   │   └── campanhas/
│   │       ├── CampanhaCard.tsx         ✅
│   │       ├── ModalNovaCampanha.tsx    ✅ Formulário completo (9 seções)
│   │       └── ModalImportarLista.tsx   ✅ CSV drag & drop + chunks 500
│   └── pages/
│       ├── auth/
│       │   └── LoginPage.tsx            ✅
│       ├── dashboard/
│       │   └── DashboardPage.tsx        ✅
│       ├── campanhas/
│       │   └── CampanhasPage.tsx        ✅
│       ├── discadora/
│       │   └── DiscadoraPage.tsx        ✅ 9 abas completas
│       ├── relatorios/
│       │   └── RelatoriosPage.tsx       ✅ 5 abas completas
│       └── inteligencia/
│           └── InteligenciaPage.tsx     ✅ 16 abas completas
```

---

## Páginas concluídas

### ✅ Login (`/login`)
- Tema claro, campo email + senha (usada como API key neste projeto)
- Lê `data.token` do backend (não `data.jwt`)
- Salva em `localStorage` ANTES de chamar `login()` e `navigate()`

### ✅ Dashboard (`/dashboard`)
- 6 KPI cards com ícones coloridos
- Lista de agentes e campanhas via React Query
- Dados do backend real

### ✅ Campanhas (`/campanhas`)
- Filtros por status (Todas/Ativa/Pausada/Arquivada) com contadores
- Busca por nome
- 4 KPI cards rápidos (Total, Ativas, Pausadas, Leads na fila)
- Grid de `CampanhaCard` com: badge de status/tipo/agressividade, barra de consumo dinâmica, 6 métricas, botão play/pause, menu 3 pontos
- `ModalNovaCampanha` com 9 seções:
  1. Tipo de campanha (5 tipos + painéis condicionais por tipo)
  2. Banner ICP com toggle
  3. Informações gerais
  4. Modalidade de reunião (3 opções + subpainel de detalhes)
  5. Vendedores com distribuição
  6. Regras de rechamada (colapsível)
  7. Janela de operação + ANATEL (colapsível)
  8. Orquestração multi-canal — 4 regras (colapsível)
  9. Proteção de dados / LGPD (colapsível)
- `ModalImportarLista` com CSV drag & drop, preview, upload em chunks de 500

### ✅ Relatórios (`/relatorios`)
5 abas — todas implementadas:

| Aba | Funcionalidades principais |
|---|---|
| **Performance** | 3 KPIs (ligações/reuniões/custo), tabela de desempenho por agente com sparklines, heatmap dia×hora, performance por perfil (Ana/Carlos/Julia destacando melhor agente), custo por agente vs SDR humano, insight do sistema, status de rechamada (4 cards 1ª/2ª/3ª/descartados), próximas reuniões agendadas, score propensão vs conversão real (gráfico semanal 4 sem), timing previsto vs real por ramo, aprendizado cross-cliente, relatório do simulador (versões v1.0 a v2.5), card ROI grande com 3 KPIs principais, 4 reduções com ícones coloridos, timeline custo Jan→Mai com legenda, CTA "ICP e agir" |
| **Funil de Conversão** | Funil 5 etapas (Discadas→Atendidas→Qualificadas→Gatilho IA→Agendados) com barras proporcionais e valores, 4 taxas entre etapas (Atendimento/Qualificação/Gatilho/Agendamento), insight IA com CTA "Ajustar gatilhos", pipeline pós-reunião 6 etapas (Agendadas→Realizadas→Proposta→Negociação→Fechado/Perdido), 4 KPIs (Show-rate, Taxa fechamento, Ticket médio, Em pipeline) |
| **Campanhas** | Tabela comparativa SP/MG/GO (Ligações, ICP médio, Gatilhos IA, Agendamentos, Conversão, Tendência) + recomendação automática do CI |
| **Evolução ICP** | Gráfico de barras 7 semanas (58→84) com gradiente brand→amber→emerald, 3 KPIs (Evolução +26pts / Ritmo +3.7/sem / Previsão sem 10), texto explicativo de como ICP evolui |
| **ROI Detalhado** | Badge "Economia: R$47.280/mês", 3 KPIs (Custo R$89, Reuniões 87, Economia R$25.4k), timeline custo por reunião Jan→Mai com cores progressivas, insight "queda de 50.6% desde Janeiro" |

Header com seletor de mês (Maio/Abril/Março 2026), seletor de agente e botões Exportar CSV/PDF.

### ✅ Discadora (`/discadora`)
9 abas — todas implementadas:

| Aba | Funcionalidades principais |
|---|---|
| **Fila** | 5 KPIs, barra de infraestrutura (Telnyx/TTS/LLM), seleção em lote (pausar/retomar/priorizar/mover), tabela com 6 colunas, painel monitor expandível com: transcrição ao vivo + injeção de script + slots inline + painel de transferência por vendedor |
| **Campanhas** | Cards das campanhas com métricas, barra de consumo, alertas, botões pausar/iniciar/ações secundárias |
| **Agendados** | 5 KPIs de pipeline, cards com dados completos (empresa/contato/reunião/vendedor), 4 botões de resultado, score de no-show, modal Jornada com pipeline visual (5 etapas) |
| **Gravações** | Tabela com filtro por agente, botões play/pause por linha, player bar fixo na base |
| **Manual** | Busca de contato, seleção com ficha, discagem direta, coluna direita com chamada ativa (timer + status + resultado) |
| **Agenda** | Seletor de vendedor, KPIs (Hoje/Semana/Mês), calendário semanal por hora (08h–17h), painel lateral com detalhe de reunião |
| **Ao Vivo** | 3 KPIs (ativas/transferências/taxa), cards dark mode com potencial + transcrição |
| **Histórico** | Filtros de período (7/15/30/Tudo), 5 KPIs do período, tabela com sinais/ICP/resultado |
| **Ramal** | 2 colunas: Equipe (status + chamar) + Suporte YouAgent + config SIP |

---

## Páginas a construir (ordem sugerida)

| # | Página | Rota | Prioridade | Protótipo |
|---|---|---|---|---|
| ~~1~~ | ~~**Inteligência (CI)**~~ | ~~`/inteligencia`~~ | ~~🔴 Alta~~ | ✅ **Concluída** — 16 abas: testes, qualidade, IC, horários, conhecimento, banco, métricas, ajuste fino, evolução, cross, padrões, simulador, ICP, A/B, mercado, sandbox |
| 2 | **E-mail / WhatsApp** | `/email` | 🟡 Média | `#pg-email` — fila de follow-ups, campanhas WZ, histórico |
| 3 | **Área do Vendedor** | `/vendedor` | 🟡 Média | `#pg-vendedor` — agenda, ficha, resultados, email, gcal, mensagens |
| 4 | **Equipe** | `/equipe` | 🟡 Média | `#pg-config` aba equipe |
| 5 | **Configurações** | `/config` | 🟡 Média | `#pg-config` — empresa, integrações, segurança, notificações |
| 6 | **Admin — Clientes** | `/admin/clientes` | 🟢 Baixa | `#pg-admin-clientes` |
| 7 | **Admin — Suporte** | `/admin/suporte` | 🟢 Baixa | `#pg-admin-suporte` |

---

## Decisões técnicas importantes

| Decisão | Motivo |
|---|---|
| Tema claro (branco) | Solicitação explícita do usuário |
| `rgba()` em vez de `bg-emerald-500/12` nas badges | Tailwind v3 não suporta opacidade em `@apply` dentro de `@layer` |
| `localStorage` síncrono no ProtectedRoute | Evitar race condition de hidratação do Zustand |
| `data.token` (não `data.jwt`) | Campo real retornado pelo backend Railway |
| Mock data nas páginas | Backend real ainda sem todas as rotas — substituir por `useQuery` quando backend estiver pronto |
| Telnyx em vez de ElevenLabs | Confirmado pelo usuário — tem voz + WhatsApp + e-mail nativos |

---

## Configuração do ambiente

```bash
# Instalar dependências
cd youagent-app
npm install

# Rodar em desenvolvimento
npm run dev
# → http://localhost:5173

# Verificar TypeScript
npx tsc --noEmit

# Build produção
npm run build
```

**Login de teste:**
- Email: qualquer e-mail cadastrado no Supabase
- Senha: API key do cliente (campo `api_key` na tabela `clientes`)

---

## Bugs conhecidos / pendências

- [ ] Mock data na Discadora — conectar ao backend quando rotas estiverem prontas
- [ ] Mock data nos Relatórios — conectar ao backend quando rotas estiverem prontas
- [ ] Mock data no Dashboard — idem
- [ ] Página `/vendedor` não criada ainda (placeholder)
- [ ] Telnyx número aguardando aprovação — integração de voz real pendente
- [ ] Upload de lista no `ModalNovaCampanha` ainda não conectado ao `contatosApi.bulkInsert`

---

## Contexto de negócio

- **Cliente piloto confirmado** — meta 01/06/2026
- **Modelo:** self-service após fechamento comercial
- **Pricing:** por agente (a definir com valores Telnyx)
- **Cenários:** A (vendedor faz tudo) + B (SDR+Closer)
- **Diferencial:** ciclo fechado de inteligência — cada ligação retroalimenta o sistema via cross-cliente

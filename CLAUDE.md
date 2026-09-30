# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

@AGENTS.md

## Projeto

Dashboard administrativo do quiz **Guardiões do Rio: Missão Sustentabilidade** e backend da API que o próprio game consome. Usa Next.js 16 (App Router e Route Handlers), React 19, Tailwind CSS 4, Supabase (Postgres), jose (JWT), bcryptjs e zod 4. Todos os textos da interface, mensagens de erro e comentários do código estão em **português do Brasil**; mantenha os novos também em pt-BR.

## Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run lint         # eslint (flat config, eslint-config-next)
npm run typecheck    # tsc --noEmit
npm run db:setup     # executa supabase/schema.sql via pg: APAGA e recria todas as tabelas e cadastra os 5 estágios
npm run seed:admin   # cria o primeiro colaborador a partir das variáveis SEED_ADMIN_*
```

Não há suíte de testes. Valide as mudanças com `typecheck`, `lint` e `build`.

As variáveis de ambiente ficam em `.env.local` (modelo: `.env.example`). Os scripts em `scripts/` carregam o `.env.local` por conta própria, via dotenv. `SUPABASE_DB_URL` (string de conexão do Session pooler) é usada só pelo `db:setup`. A aplicação acessa o Supabase por `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

## Arquitetura

**Acesso a dados:** não há Supabase Auth nem acesso pelo client com RLS. Toda chamada ao banco roda no servidor, com o client service-role de `getSupabase()` em `lib/supabase.ts`. Módulos exclusivos do servidor importam `"server-only"`. As colunas do Postgres são camelCase (`idStage`, `isCorrect`, `createdAt`), por isso precisam de aspas duplas nas strings de `select` do Supabase, por exemplo `'id, "idStage", answers(id, "isCorrect")'`. O esquema está em `supabase/schema.sql`.

**Autenticação:** a sessão é um JWT próprio (HS256, 8h) guardado no cookie `quiz_session` e assinado em `lib/session.ts`. Esse arquivo é compatível com edge porque o `proxy.ts` também o usa.
- `POST /api/signe` faz o login e `POST /api/unsigned` faz o logout. Qualquer colaborador logado tem acesso total; não há papéis.
- `proxy.ts` (substituto do `middleware.ts` no Next 16) faz uma checagem otimista: redireciona as páginas para `/login` e devolve 401 nas APIs privadas. O `matcher` dele lista explicitamente cada rota privada da API, então **toda nova rota privada precisa ser adicionada ali**.
- Cada handler privado também precisa chamar `requireSession()` de `lib/auth.ts` e retornar logo se receber um `NextResponse`. `app/dashboard/layout.tsx` revalida a sessão no servidor.

**Rotas da API:** cada rota tem sua própria pasta em `app/api/<nome>/route.ts`. Os nomes são verbos, sem hierarquia (`createquestion`, `updatedanswer`, `deletecollaborator`), e não seguem recursos REST. Exclusões usam `DELETE ?id=<uuid>`. O padrão de um handler é: `requireSession()`, depois `parseBody(request, zodSchema)` de `lib/http.ts`, depois a chamada ao Supabase e, se houver falha, `dbError(error)`, que converte 23505 em 409 e 23503 em 404. Os erros sempre voltam como `{ error: string }`. Os schemas zod e suas mensagens em pt-BR ficam em `lib/validators.ts`. Não há transações entre tabelas pelo Supabase, então handlers que gravam em mais de uma tabela desfazem as gravações manualmente (veja `createquestion`). A tabela completa de rotas está no `README.md`.

**APIs públicas do game:** o game usa `stages`, `questions`, `questionsgame` e `registerplay`, por isso o formato das respostas dessas rotas é um contrato. `questionsgame` devolve os estágios de 0 a 4 em ordem, sorteia `GAME_QUESTIONS_PER_STAGE` (5) questões de cada estágio e embaralha as respostas.

**Regras de domínio** (constantes em `lib/types.ts`, aplicadas nos validators):
- Há exatamente 5 estágios, com ids de 0 a 4.
- Cada questão tem exatamente 4 respostas, e exatamente 1 delas é a certa.
- Enunciado e respostas têm no mínimo 10 caracteres.

**Frontend:** as páginas do dashboard (`app/dashboard/*`) são client components.
- Busca de dados: as páginas carregam dados com o hook `useApiData(url)`, que retorna `{ data, error, loading, reload }`, e fazem as mutações com `api()` de `lib/api.ts`. `api()` lança `ApiError` e redireciona para `/login` quando recebe 401.
- Formulários: validam no client com os mesmos schemas zod, e `fieldErrors()` em `lib/formErrors.ts` transforma os erros em chaves como `answers.2.answer`.
- Componentes compartilhados: os blocos de interface (Button, Modal, ConfirmDialog, Alert, Spinner, PageTitle…) estão em `components/ui.tsx`.
- `AwakeGate`: o layout raiz envolve toda a aplicação no `AwakeGate`. Ele chama `/api/awakeserver` repetidamente até o Supabase responder (o plano gratuito demora na primeira conexão) e depois guarda esse resultado no `sessionStorage`.

**Estilo:** os tokens de cor estão no `@theme` de `app/globals.css` (`primary`, `sidebar`, `sidebar-active`, `sidebar-item`, `background`). Use esses tokens em vez de valores hexadecimais soltos.

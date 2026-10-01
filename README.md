# Guardiões do Rio — Dashboard

Dashboard administrativo do quiz **Guardiões do Rio: Missão Sustentabilidade**.
Permite ver quantos alunos jogaram (por escola e turma), cadastrar questões e respostas por estágio e gerenciar colaboradores.
Também expõe as APIs que o game consome.

**Stack:** Next.js 16 (App Router e Route Handlers), Tailwind CSS 4, Supabase, lucide-react, jose (JWT), bcryptjs e zod.

## Configuração

1. Copie `.env.example` para `.env.local` e preencha:
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: a chave **secret/service_role**, que fica **somente no servidor**.
   - `SUPABASE_DB_URL`: string do **Session pooler** (botão Connect no painel). É usada só pelo `db:setup`.
   - `JWT_SECRET`: texto aleatório com 32 caracteres ou mais.
   - `SEED_ADMIN_*`: dados do primeiro colaborador.
2. Instale e prepare o banco:
   ```bash
   npm install
   npm run db:setup     # recria as tabelas e cadastra os 5 estágios (APAGA os dados existentes)
   npm run seed:admin   # cria o primeiro colaborador
   npm run dev
   ```
   Em um banco que já existe, use `npm run db:migrate` no lugar do `db:setup`: ele aplica as migrações de `supabase/migrations` **sem apagar dados**.

> **Supabase free:** o projeto é pausado depois de 7 dias sem atividade. Uma requisição não consegue reativá-lo; isso só se faz pelo painel.
> A tela "Acordando o servidor" (rota `awakeserver`) cobre a latência da primeira conexão.

## Banco de dados

O esquema está em [supabase/schema.sql](supabase/schema.sql):

| Tabela | Colunas |
|---|---|
| `alunos` | id, name, turma, escola, conclude, createdAt, updatedAt |
| `colaboradores` | id, name, email, position, passwordhash, createdAt, updatedAt |
| `stage` | id (0 a 4), stagename, createdAt, updatedAt |
| `questions` | id, question, idStage, createdAt, updatedAt |
| `answers` | id, answer, isCorrect, idQuestion, createdAt, updatedAt |
| `questionserros` | id, stage, idQuestion, escola, idUser (aluno), createdAt, updatedAt |

Regras:
- Não há limite de questões por estágio; o game sorteia **5 de cada estágio** a cada partida.
- Cada questão tem **4 respostas**, com **exatamente 1 certa**.
- Enunciado e respostas têm no mínimo 10 caracteres.

## Rotas da API (`/api/...`)

Rotas privadas exigem o cookie de sessão criado por `signe`. Qualquer colaborador logado tem acesso total. Exclusões usam `DELETE ?id=<uuid>`.

| Rota | Método | Acesso | Corpo / parâmetros |
|---|---|---|---|
| `awakeserver` | GET | pública | — |
| `signe` | POST | pública | `{ email, password }` |
| `unsigned` | POST | pública | — |
| `updatepassword` | PUT | privada | `{ currentPassword, newPassword }` |
| `stages` | GET | pública | — |
| `questions` | GET | pública | `?idStage=0..4` (opcional) |
| `questionsgame` | GET | pública | — |
| `createquestion` | POST | privada | `{ idStage, question, answers: [{ answer, isCorrect }] x4 }` |
| `updatequestion` | PUT | privada | `{ id, idStage?, question?, answers?: [{ id, answer, isCorrect }] x4 }` |
| `deletequestion` | DELETE | privada | `?id=` |
| `createanswer` | POST | privada | `{ idQuestion, answer, isCorrect }` |
| `updatedanswer` | PUT | privada | `{ id, answer?, isCorrect? }` |
| `deleteanswer` | DELETE | privada | `?id=` |
| `registerplay` | POST | pública | `{ name, turma, escola, conclude? }`, retorna `{ id }` |
| `registerplay` | PUT | pública | `{ id, conclude }`, marca que o aluno concluiu |
| `registererror` | POST | pública | `{ idUser, idQuestion }`, registra uma resposta errada (estágio e escola são preenchidos pelo servidor) |
| `reports` | GET | privada | `?escola=&turma=&from=AAAA-MM-DD&to=AAAA-MM-DD`, inclui erros por grupo e a lista de alunos |
| `statistics` | GET | privada | `?from=AAAA-MM-DD&to=AAAA-MM-DD`, ranking de erros por estágio, questão e escola |
| `collaborators` | GET | privada | — |
| `createcollaborator` | POST | privada | `{ name, email, position, password }` |
| `updatecollaborator` | PUT | privada | `{ id, name?, email?, position?, password? }` |
| `deletecollaborator` | DELETE | privada | `?id=` |

### Formato de `questionsgame`

Retorna os estágios de 0 a 4 em ordem. A cada chamada, **sorteia 5 questões de cada estágio** entre todas as cadastradas e embaralha as respostas de cada questão.

```json
{
  "stages": [
    {
      "id": 0,
      "stagename": "CONHECENDO O RIO",
      "questions": [
        {
          "id": "…",
          "question": "…",
          "answers": [{ "id": "…", "answer": "…", "isCorrect": false }]
        }
      ]
    }
  ]
}
```

## Cores

As cores são tokens em [app/globals.css](app/globals.css) (`@theme`) e foram medidas nas imagens de referência:
- `primary` / `sidebar`: `#0253A0`
- `sidebar-active`: `#1780E2`
- `sidebar-item`: `#0558A8`
- `background`: `#D9D9D9`

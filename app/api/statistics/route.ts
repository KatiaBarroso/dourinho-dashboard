import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError } from "@/lib/http";
import { fetchAllRows, getSupabase } from "@/lib/supabase";
import type { StatsData } from "@/lib/types";

type ErroRow = { stage: number; idQuestion: string; escola: string; idUser: string };

const byErros = <T extends { erros: number }>(a: T, b: T) => b.erros - a.erros;

function countBy<K>(rows: ErroRow[], key: (row: ErroRow) => K) {
  const counts = new Map<K, number>();
  for (const row of rows) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  return counts;
}

// Privada: ranking de erros dos alunos por estágio, questão e escola (maior incidência primeiro).
// Filtros opcionais (query string): from, to (AAAA-MM-DD), sobre a data do erro.
export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const params = new URL(request.url).searchParams;
  const from = params.get("from");
  const to = params.get("to");

  const supabase = getSupabase();
  const [erros, stages, questions] = await Promise.all([
    fetchAllRows<ErroRow>((start, end) => {
      let query = supabase
        .from("questionserros")
        .select('stage, "idQuestion", escola, "idUser"')
        .order("createdAt")
        .range(start, end);
      if (from) query = query.gte("createdAt", `${from}T00:00:00`);
      if (to) query = query.lte("createdAt", `${to}T23:59:59.999`);
      return query;
    }),
    supabase.from("stage").select("id, stagename").order("id"),
    fetchAllRows<{ id: string; question: string; idStage: number }>((start, end) =>
      supabase.from("questions").select('id, question, "idStage"').order("createdAt").range(start, end),
    ),
  ]);
  if ("error" in erros) return dbError(erros.error);
  if (stages.error) return dbError(stages.error);
  if ("error" in questions) return dbError(questions.error);

  const stageNames = new Map(stages.data.map((s) => [s.id, s.stagename as string]));
  const questionById = new Map(questions.data.map((q) => [q.id, q]));
  const byStage = countBy(erros.data, (r) => r.stage);
  const byQuestion = countBy(erros.data, (r) => r.idQuestion);
  const bySchool = countBy(erros.data, (r) => r.escola);

  const stats: StatsData = {
    totals: { erros: erros.data.length, alunos: new Set(erros.data.map((r) => r.idUser)).size },
    // Todos os estágios aparecem, mesmo os sem erros.
    stages: stages.data
      .map((s) => ({ id: s.id as number, stagename: s.stagename as string, erros: byStage.get(s.id) ?? 0 }))
      .sort((a, b) => byErros(a, b) || a.id - b.id),
    questions: [...byQuestion]
      .map(([id, count]) => {
        const q = questionById.get(id);
        return { id, question: q?.question ?? "(questão removida)", stagename: q ? stageNames.get(q.idStage) ?? "" : "", erros: count };
      })
      .sort((a, b) => byErros(a, b) || a.question.localeCompare(b.question, "pt-BR")),
    escolas: [...bySchool]
      .map(([escola, count]) => ({ escola, erros: count }))
      .sort((a, b) => byErros(a, b) || a.escola.localeCompare(b.escola, "pt-BR")),
  };

  return NextResponse.json(stats, { headers: { "Cache-Control": "no-store" } });
}

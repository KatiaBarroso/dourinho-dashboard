import "server-only";
import { getSupabase } from "./supabase";
import type { Question, Stage } from "./types";

type DbError = { code?: string; message: string };

/** Busca as questões (opcionalmente de um estágio) com respostas, na ordem de criação. */
export async function fetchQuestions(idStage?: number): Promise<{ data: Question[] } | { error: DbError }> {
  let query = getSupabase()
    .from("questions")
    .select('id, question, "idStage", "createdAt", answers(id, answer, "isCorrect", "createdAt")')
    .order("idStage")
    .order("createdAt")
    .order("createdAt", { referencedTable: "answers" });
  if (idStage !== undefined) query = query.eq("idStage", idStage);

  const { data, error } = await query;
  if (error) return { error };

  return {
    data: data.map((q) => ({
      id: q.id,
      question: q.question,
      idStage: q.idStage,
      createdAt: q.createdAt,
      answers: q.answers.map((a) => ({ id: a.id, answer: a.answer, isCorrect: a.isCorrect })),
    })),
  };
}

export async function fetchStages(): Promise<{ data: Stage[] } | { error: DbError }> {
  const { data, error } = await getSupabase().from("stage").select("id, stagename").order("id");
  if (error) return { error };
  return { data };
}


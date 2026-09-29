import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError, jsonError, parseBody } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { updateQuestionSchema } from "@/lib/validators";

// Privada: altera enunciado e/ou estágio e, opcionalmente, as 4 respostas.
export async function PUT(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const parsed = await parseBody(request, updateQuestionSchema);
  if ("error" in parsed) return parsed.error;
  const { id, question, idStage, answers } = parsed.data;
  if (question === undefined && idStage === undefined && answers === undefined) {
    return jsonError("Nada para alterar.", 400);
  }

  const supabase = getSupabase();
  const { data: current, error: findError } = await supabase
    .from("questions")
    .select("id, answers(id)")
    .eq("id", id)
    .maybeSingle();
  if (findError) return dbError(findError);
  if (!current) return jsonError("Questão não encontrada.", 404);

  // As respostas enviadas precisam ser exatamente as da questão.
  if (answers) {
    const existing = new Set(current.answers.map((a) => a.id));
    if (answers.some((a) => !existing.has(a.id)) || new Set(answers.map((a) => a.id)).size !== existing.size) {
      return jsonError("As respostas enviadas não pertencem a esta questão.", 400);
    }
  }

  const changes: { question?: string; idStage?: number } = {};
  if (question !== undefined) changes.question = question;
  if (idStage !== undefined) changes.idStage = idStage;
  if (Object.keys(changes).length > 0) {
    const { error } = await supabase.from("questions").update(changes).eq("id", id);
    if (error) return dbError(error);
  }

  if (answers) {
    // Desmarca todas antes, para nunca existirem duas corretas ao mesmo tempo.
    const { error: resetError } = await supabase.from("answers").update({ isCorrect: false }).eq("idQuestion", id);
    if (resetError) return dbError(resetError);
    for (const a of answers) {
      const { error } = await supabase.from("answers").update({ answer: a.answer, isCorrect: a.isCorrect }).eq("id", a.id);
      if (error) return dbError(error);
    }
  }

  return NextResponse.json({ ok: true });
}

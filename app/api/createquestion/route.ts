import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError, parseBody } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { createQuestionSchema } from "@/lib/validators";

// Privada: cria a questão junto com suas 4 respostas.
export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const parsed = await parseBody(request, createQuestionSchema);
  if ("error" in parsed) return parsed.error;
  const { idStage, question, answers } = parsed.data;

  const supabase = getSupabase();
  const { data: created, error } = await supabase
    .from("questions")
    .insert({ question, idStage })
    .select('id, question, "idStage", "createdAt"')
    .single();
  if (error) return dbError(error);

  const { data: inserted, error: answersError } = await supabase
    .from("answers")
    .insert(answers.map((a) => ({ idQuestion: created.id, answer: a.answer, isCorrect: a.isCorrect })))
    .select('id, answer, "isCorrect"');
  if (answersError) {
    // Desfaz a questão para não deixá-la sem respostas.
    await supabase.from("questions").delete().eq("id", created.id);
    return dbError(answersError);
  }

  return NextResponse.json({ ...created, answers: inserted }, { status: 201 });
}

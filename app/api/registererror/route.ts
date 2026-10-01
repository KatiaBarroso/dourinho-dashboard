import { NextResponse } from "next/server";
import { dbError, jsonError, parseBody } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { registerErrorSchema } from "@/lib/validators";

// Pública: o game registra cada resposta errada do aluno. Corpo: { idUser, idQuestion }
// O estágio vem da questão e a escola vem do aluno.
export async function POST(request: Request) {
  const parsed = await parseBody(request, registerErrorSchema);
  if ("error" in parsed) return parsed.error;
  const { idUser, idQuestion } = parsed.data;

  const supabase = getSupabase();
  const [aluno, question] = await Promise.all([
    supabase.from("alunos").select("escola").eq("id", idUser).maybeSingle(),
    supabase.from("questions").select('"idStage"').eq("id", idQuestion).maybeSingle(),
  ]);
  if (aluno.error) return dbError(aluno.error);
  if (question.error) return dbError(question.error);
  if (!aluno.data) return jsonError("Aluno não encontrado.", 404);
  if (!question.data) return jsonError("Questão não encontrada.", 404);

  const { data, error } = await supabase
    .from("questionserros")
    .insert({ idUser, idQuestion, stage: question.data.idStage, escola: aluno.data.escola })
    .select("id")
    .single();
  if (error) return dbError(error);

  return NextResponse.json({ id: data.id }, { status: 201 });
}

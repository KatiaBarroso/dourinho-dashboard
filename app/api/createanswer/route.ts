import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError, jsonError, parseBody } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { ANSWERS_PER_QUESTION } from "@/lib/types";
import { createAnswerSchema } from "@/lib/validators";

// Privada: adiciona uma resposta a uma questão (máximo de 4).
export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const parsed = await parseBody(request, createAnswerSchema);
  if ("error" in parsed) return parsed.error;
  const { idQuestion, answer, isCorrect } = parsed.data;

  const supabase = getSupabase();
  const { count, error: countError } = await supabase
    .from("answers")
    .select("id", { count: "exact", head: true })
    .eq("idQuestion", idQuestion);
  if (countError) return dbError(countError);
  if ((count ?? 0) >= ANSWERS_PER_QUESTION) {
    return jsonError(`A questão já possui ${ANSWERS_PER_QUESTION} respostas.`, 409);
  }

  // Só pode haver uma resposta correta por questão.
  if (isCorrect) {
    const { error } = await supabase.from("answers").update({ isCorrect: false }).eq("idQuestion", idQuestion);
    if (error) return dbError(error);
  }

  const { data, error } = await supabase
    .from("answers")
    .insert({ idQuestion, answer, isCorrect })
    .select('id, answer, "isCorrect"')
    .single();
  if (error) return dbError(error);

  return NextResponse.json(data, { status: 201 });
}

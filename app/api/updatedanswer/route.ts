import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError, jsonError, parseBody } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { updateAnswerSchema } from "@/lib/validators";

// Privada: altera o texto e/ou marca a resposta como correta.
export async function PUT(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const parsed = await parseBody(request, updateAnswerSchema);
  if ("error" in parsed) return parsed.error;
  const { id, answer, isCorrect } = parsed.data;
  if (answer === undefined && isCorrect === undefined) return jsonError("Nada para alterar.", 400);

  const supabase = getSupabase();
  const { data: current, error: findError } = await supabase
    .from("answers")
    .select('"idQuestion"')
    .eq("id", id)
    .maybeSingle();
  if (findError) return dbError(findError);
  if (!current) return jsonError("Resposta não encontrada.", 404);

  // Só pode haver uma resposta correta por questão.
  if (isCorrect) {
    const { error } = await supabase
      .from("answers")
      .update({ isCorrect: false })
      .eq("idQuestion", current.idQuestion)
      .neq("id", id);
    if (error) return dbError(error);
  }

  const changes: { answer?: string; isCorrect?: boolean } = {};
  if (answer !== undefined) changes.answer = answer;
  if (isCorrect !== undefined) changes.isCorrect = isCorrect;

  const { data, error } = await supabase
    .from("answers")
    .update(changes)
    .eq("id", id)
    .select('id, answer, "isCorrect"')
    .single();
  if (error) return dbError(error);

  return NextResponse.json(data);
}

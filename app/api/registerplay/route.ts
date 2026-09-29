import { NextResponse } from "next/server";
import { dbError, jsonError, parseBody } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { concludePlaySchema, registerPlaySchema } from "@/lib/validators";

// Pública: o game registra o aluno ao começar a jogar. Retorna o id do aluno.
export async function POST(request: Request) {
  const parsed = await parseBody(request, registerPlaySchema);
  if ("error" in parsed) return parsed.error;

  const { data, error } = await getSupabase().from("alunos").insert(parsed.data).select("id").single();
  if (error) return dbError(error);

  return NextResponse.json({ id: data.id }, { status: 201 });
}

// Pública: o game marca que o aluno concluiu o quiz. Corpo: { id, conclude }
export async function PUT(request: Request) {
  const parsed = await parseBody(request, concludePlaySchema);
  if ("error" in parsed) return parsed.error;
  const { id, conclude } = parsed.data;

  const { data, error } = await getSupabase().from("alunos").update({ conclude }).eq("id", id).select("id");
  if (error) return dbError(error);
  if (!data.length) return jsonError("Aluno não encontrado.", 404);

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError, jsonError, parseBody } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { getSupabase } from "@/lib/supabase";
import { createColaboradorSchema } from "@/lib/validators";

// Privada: cadastra um colaborador.
export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const parsed = await parseBody(request, createColaboradorSchema);
  if ("error" in parsed) return parsed.error;
  const { name, email, position, password } = parsed.data;

  const { data, error } = await getSupabase()
    .from("colaboradores")
    .insert({ name, email, position, passwordhash: await hashPassword(password) })
    .select('id, name, email, position, "createdAt"')
    .single();
  if (error) {
    if (error.code === "23505") return jsonError("Este e-mail já está cadastrado.", 409);
    return dbError(error);
  }

  return NextResponse.json(data, { status: 201 });
}

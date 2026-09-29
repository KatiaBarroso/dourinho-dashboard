import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError, jsonError, parseBody } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { getSupabase } from "@/lib/supabase";
import { updateColaboradorSchema } from "@/lib/validators";

// Privada: altera nome, e-mail, cargo e/ou redefine a senha.
export async function PUT(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const parsed = await parseBody(request, updateColaboradorSchema);
  if ("error" in parsed) return parsed.error;
  const { id, name, email, position, password } = parsed.data;

  const changes: Record<string, string> = {};
  if (name !== undefined) changes.name = name;
  if (email !== undefined) changes.email = email;
  if (position !== undefined) changes.position = position;
  if (password !== undefined) changes.passwordhash = await hashPassword(password);
  if (Object.keys(changes).length === 0) return jsonError("Nada para alterar.", 400);

  const { data, error } = await getSupabase()
    .from("colaboradores")
    .update(changes)
    .eq("id", id)
    .select('id, name, email, position, "createdAt"')
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return jsonError("Este e-mail já está cadastrado.", 409);
    return dbError(error);
  }
  if (!data) return jsonError("Colaborador não encontrado.", 404);

  return NextResponse.json(data);
}

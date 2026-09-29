import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError, jsonError, parseBody } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSupabase } from "@/lib/supabase";
import { updatePasswordSchema } from "@/lib/validators";

// Privada: o colaborador logado altera a própria senha.
export async function PUT(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const parsed = await parseBody(request, updatePasswordSchema);
  if ("error" in parsed) return parsed.error;
  const { currentPassword, newPassword } = parsed.data;

  const supabase = getSupabase();
  const { data: user, error } = await supabase
    .from("colaboradores")
    .select("passwordhash")
    .eq("id", session.sub)
    .maybeSingle();
  if (error) return dbError(error);
  if (!user) return jsonError("Colaborador não encontrado.", 404);

  if (!(await verifyPassword(currentPassword, user.passwordhash))) {
    return jsonError("Senha atual incorreta.", 400);
  }

  const { error: updateError } = await supabase
    .from("colaboradores")
    .update({ passwordhash: await hashPassword(newPassword) })
    .eq("id", session.sub);
  if (updateError) return dbError(updateError);

  return NextResponse.json({ ok: true });
}

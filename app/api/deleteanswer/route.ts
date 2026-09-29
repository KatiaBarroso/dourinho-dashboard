import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError, jsonError } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { idSchema } from "@/lib/validators";

// Privada: remove uma resposta. Uso: DELETE ?id=<uuid>
export async function DELETE(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const parsed = idSchema.safeParse({ id: new URL(request.url).searchParams.get("id") });
  if (!parsed.success) return jsonError("id inválido.", 400);

  const { data, error } = await getSupabase().from("answers").delete().eq("id", parsed.data.id).select("id");
  if (error) return dbError(error);
  if (!data.length) return jsonError("Resposta não encontrada.", 404);

  return NextResponse.json({ ok: true });
}

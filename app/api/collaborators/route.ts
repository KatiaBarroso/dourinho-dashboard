import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";

// Privada: lista os colaboradores.
export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { data, error } = await getSupabase()
    .from("colaboradores")
    .select('id, name, email, position, "createdAt"')
    .order("name");
  if (error) return dbError(error);

  return NextResponse.json({ collaborators: data, currentUserId: session.sub }, { headers: { "Cache-Control": "no-store" } });
}

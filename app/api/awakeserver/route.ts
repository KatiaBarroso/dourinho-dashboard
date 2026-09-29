import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Pública: faz uma consulta leve para "acordar" o Supabase.
export async function GET() {
  try {
    const { error } = await getSupabase()
      .from("questions")
      .select("id")
      .limit(1)
      .abortSignal(AbortSignal.timeout(10_000));

    if (error) throw error;
    return NextResponse.json({ status: "awake" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[awakeserver]", error);
    return NextResponse.json(
      { status: "sleeping", error: "Servidor indisponível." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

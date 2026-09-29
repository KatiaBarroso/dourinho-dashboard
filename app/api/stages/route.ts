import { NextResponse } from "next/server";
import { dbError } from "@/lib/http";
import { fetchStages } from "@/lib/questions";

// Pública: lista os 5 estágios (índices 0 a 4).
export async function GET() {
  const result = await fetchStages();
  if ("error" in result) return dbError(result.error);
  return NextResponse.json({ stages: result.data });
}

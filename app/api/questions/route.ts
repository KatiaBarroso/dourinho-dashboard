import { NextResponse } from "next/server";
import { dbError, jsonError } from "@/lib/http";
import { fetchQuestions } from "@/lib/questions";

// Pública: lista as questões com respostas (dashboard). Filtro opcional: ?idStage=0..4
export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("idStage");
  let idStage: number | undefined;
  if (param !== null && param !== "") {
    idStage = Number(param);
    if (!Number.isInteger(idStage) || idStage < 0 || idStage > 4) return jsonError("Estágio inválido.", 400);
  }

  const result = await fetchQuestions(idStage);
  if ("error" in result) return dbError(result.error);
  return NextResponse.json({ questions: result.data }, { headers: { "Cache-Control": "no-store" } });
}

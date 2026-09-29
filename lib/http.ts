import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Faz o parse do corpo JSON e valida com zod; em caso de erro devolve 400. */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: jsonError("Corpo da requisição inválido.", 400) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: jsonError(result.error.issues[0]?.message ?? "Dados inválidos.", 400) };
  }
  return { data: result.data };
}

/** Converte erros do Supabase/Postgres em respostas HTTP amigáveis. */
export function dbError(error: { code?: string; message: string }) {
  if (error.code === "23505") return jsonError("Registro duplicado.", 409);
  if (error.code === "23503") return jsonError("Registro relacionado não encontrado.", 404);
  console.error("[supabase]", error);
  return jsonError("Erro ao acessar o banco de dados.", 500);
}

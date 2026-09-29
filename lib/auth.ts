import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session";

/** Lê e valida a sessão do cookie (Server Components e Route Handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Garante sessão válida em rotas privadas.
 * Retorna a sessão ou uma resposta 401 que deve ser devolvida pelo handler.
 */
export async function requireSession(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  return session;
}

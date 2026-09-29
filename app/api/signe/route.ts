import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { dbError, jsonError, parseBody } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";
import { signInSchema } from "@/lib/validators";

// Hash fictício para manter o tempo de resposta parecido quando o e-mail não existe.
const DUMMY_HASH = "$2b$10$lFxaRbhBjG70NY3GwSFa1eg9mK3/rrYklWSUynbESkKJoP/fWZP8m";

// Pública: login com e-mail + senha.
export async function POST(request: Request) {
  const parsed = await parseBody(request, signInSchema);
  if ("error" in parsed) return parsed.error;
  const { email, password } = parsed.data;

  const { data: user, error } = await getSupabase()
    .from("colaboradores")
    .select("id, name, email, position, passwordhash")
    .eq("email", email)
    .maybeSingle();
  if (error) return dbError(error);

  const valid = await verifyPassword(password, user?.passwordhash ?? DUMMY_HASH);
  if (!user || !valid) return jsonError("E-mail ou senha incorretos.", 401);

  const token = await signSession({ sub: user.id, name: user.name, email: user.email, position: user.position });

  const response = NextResponse.json({ name: user.name, position: user.position });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

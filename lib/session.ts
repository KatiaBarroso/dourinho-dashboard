import { SignJWT, jwtVerify } from "jose";

// Funções de JWT sem dependências de servidor, usadas também pelo proxy.ts.

export const SESSION_COOKIE = "quiz_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

export type SessionPayload = {
  sub: string; // id do colaborador
  name: string;
  email: string;
  position: string;
};

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ name: payload.name, email: payload.email, position: payload.position })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      position: String(payload.position ?? ""),
    };
  } catch {
    return null;
  }
}

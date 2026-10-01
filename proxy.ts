import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Checagem otimista de sessão. Cada rota privada revalida com requireSession().

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/")) {
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return session ? NextResponse.redirect(new URL("/dashboard", request.url)) : NextResponse.next();
  }

  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/api/updatepassword",
    "/api/createquestion",
    "/api/updatequestion",
    "/api/deletequestion",
    "/api/createanswer",
    "/api/updatedanswer",
    "/api/deleteanswer",
    "/api/reports",
    "/api/statistics",
    "/api/collaborators",
    "/api/createcollaborator",
    "/api/updatecollaborator",
    "/api/deletecollaborator",
  ],
};

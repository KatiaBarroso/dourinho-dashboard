import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError } from "@/lib/http";
import { fetchAllRows, getSupabase } from "@/lib/supabase";
import type { ReportAluno, ReportData, ReportGroup } from "@/lib/types";

type AlunoRow = Omit<ReportAluno, "erros">;

const byName = (a: string, b: string) => a.localeCompare(b, "pt-BR");

// Privada: alunos que jogaram, agrupados por escola e turma, e a lista de alunos com a quantidade de erros.
// Filtros opcionais (query string): escola, turma, from, to (AAAA-MM-DD).
export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const params = new URL(request.url).searchParams;
  const escola = params.get("escola");
  const turma = params.get("turma");
  const from = params.get("from");
  const to = params.get("to");

  const supabase = getSupabase();
  const [alunos, erros] = await Promise.all([
    fetchAllRows<AlunoRow>((start, end) => {
      let query = supabase
        .from("alunos")
        .select('id, name, escola, turma, conclude, "createdAt"')
        .order("createdAt")
        .range(start, end);
      if (escola) query = query.eq("escola", escola);
      if (turma) query = query.eq("turma", turma);
      if (from) query = query.gte("createdAt", `${from}T00:00:00`);
      if (to) query = query.lte("createdAt", `${to}T23:59:59.999`);
      return query;
    }),
    // Erros de todos os alunos; só os dos alunos filtrados entram na contagem.
    fetchAllRows<{ idUser: string }>((start, end) => {
      let query = supabase.from("questionserros").select('"idUser"').order("createdAt").range(start, end);
      if (escola) query = query.eq("escola", escola);
      return query;
    }),
  ]);
  if ("error" in alunos) return dbError(alunos.error);
  if ("error" in erros) return dbError(erros.error);

  // Opções dos filtros (sempre sobre todos os alunos).
  const { data: all, error: filtersError } = await supabase.from("alunos").select("escola, turma").limit(10_000);
  if (filtersError) return dbError(filtersError);

  const errosByAluno = new Map<string, number>();
  for (const { idUser } of erros.data) errosByAluno.set(idUser, (errosByAluno.get(idUser) ?? 0) + 1);

  const rows: ReportAluno[] = alunos.data.map((a) => ({ ...a, erros: errosByAluno.get(a.id) ?? 0 }));

  const groups = new Map<string, ReportGroup>();
  for (const row of rows) {
    const key = `${row.escola}\u0000${row.turma}`;
    const group = groups.get(key) ?? { escola: row.escola, turma: row.turma, alunos: 0, concluiram: 0, erros: 0 };
    group.alunos += 1;
    if (row.conclude) group.concluiram += 1;
    group.erros += row.erros;
    groups.set(key, group);
  }

  const report: ReportData = {
    totals: {
      alunos: rows.length,
      concluiram: rows.filter((r) => r.conclude).length,
      escolas: new Set(rows.map((r) => r.escola)).size,
      turmas: groups.size,
      erros: rows.reduce((sum, r) => sum + r.erros, 0),
    },
    groups: [...groups.values()].sort((a, b) => byName(a.escola, b.escola) || byName(a.turma, b.turma)),
    alunos: rows.sort((a, b) => byName(a.escola, b.escola) || byName(a.turma, b.turma) || byName(a.name, b.name)),
    filters: {
      escolas: [...new Set(all.map((r) => r.escola))].sort(byName),
      turmas: [...new Set(all.map((r) => r.turma))].sort(byName),
    },
  };

  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}

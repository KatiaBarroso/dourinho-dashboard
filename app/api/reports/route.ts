import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dbError } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import type { ReportData, ReportGroup } from "@/lib/types";

const PAGE_SIZE = 1000; // limite padrão de linhas por consulta no Supabase

type AlunoRow = { escola: string; turma: string; conclude: boolean };

const byName = (a: string, b: string) => a.localeCompare(b, "pt-BR");

// Privada: quantidade de alunos que jogaram, agrupados por escola e turma.
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
  const rows: AlunoRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from("alunos")
      .select("escola, turma, conclude")
      .order("createdAt")
      .range(offset, offset + PAGE_SIZE - 1);
    if (escola) query = query.eq("escola", escola);
    if (turma) query = query.eq("turma", turma);
    if (from) query = query.gte("createdAt", `${from}T00:00:00`);
    if (to) query = query.lte("createdAt", `${to}T23:59:59.999`);

    const { data, error } = await query;
    if (error) return dbError(error);
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  // Opções dos filtros (sempre sobre todos os alunos).
  const { data: all, error: filtersError } = await supabase.from("alunos").select("escola, turma").limit(10_000);
  if (filtersError) return dbError(filtersError);

  const groups = new Map<string, ReportGroup>();
  for (const row of rows) {
    const key = `${row.escola}\u0000${row.turma}`;
    const group = groups.get(key) ?? { escola: row.escola, turma: row.turma, alunos: 0, concluiram: 0 };
    group.alunos += 1;
    if (row.conclude) group.concluiram += 1;
    groups.set(key, group);
  }

  const report: ReportData = {
    totals: {
      alunos: rows.length,
      concluiram: rows.filter((r) => r.conclude).length,
      escolas: new Set(rows.map((r) => r.escola)).size,
      turmas: groups.size,
    },
    groups: [...groups.values()].sort((a, b) => byName(a.escola, b.escola) || byName(a.turma, b.turma)),
    filters: {
      escolas: [...new Set(all.map((r) => r.escola))].sort(byName),
      turmas: [...new Set(all.map((r) => r.turma))].sort(byName),
    },
  };

  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}

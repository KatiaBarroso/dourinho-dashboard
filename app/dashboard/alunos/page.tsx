"use client";

import { useState } from "react";
import { CircleCheck, GraduationCap, School, Users } from "lucide-react";
import { useApiData } from "@/lib/useApiData";
import type { ReportData } from "@/lib/types";
import { Alert, Button, Field, PageTitle, Spinner, inputClass } from "@/components/ui";

type Filters = { escola: string; turma: string; from: string; to: string };
const EMPTY_FILTERS: Filters = { escola: "", turma: "", from: "", to: "" };

function toQuery(filters: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default function AlunosPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const { data: report, error, loading } = useApiData<ReportData>(`/api/reports${query}`);

  function apply(f: Filters) {
    setFilters(f);
    setQuery(toQuery(f));
  }

  const cards = report
    ? [
        { label: "Alunos que jogaram", value: report.totals.alunos, icon: Users },
        { label: "Concluíram o quiz", value: report.totals.concluiram, icon: CircleCheck },
        { label: "Escolas", value: report.totals.escolas, icon: School },
        { label: "Turmas", value: report.totals.turmas, icon: GraduationCap },
      ]
    : [];

  return (
    <>
      <PageTitle title="Alunos" description="Quantidade de alunos que jogaram, por escola e turma." />

      <form
        className="mb-6 grid gap-4 rounded-xl bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          apply(filters);
        }}
      >
        <Field label="Escola">
          {(id) => (
            <select id={id} className={inputClass} value={filters.escola} onChange={(e) => setFilters({ ...filters, escola: e.target.value })}>
              <option value="">Todas</option>
              {report?.filters.escolas.map((s) => <option key={s}>{s}</option>)}
            </select>
          )}
        </Field>
        <Field label="Turma">
          {(id) => (
            <select id={id} className={inputClass} value={filters.turma} onChange={(e) => setFilters({ ...filters, turma: e.target.value })}>
              <option value="">Todas</option>
              {report?.filters.turmas.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
        </Field>
        <Field label="De">
          {(id) => <input id={id} type="date" className={inputClass} value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />}
        </Field>
        <Field label="Até">
          {(id) => <input id={id} type="date" className={inputClass} value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />}
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">Filtrar</Button>
          <Button type="button" variant="secondary" onClick={() => apply(EMPTY_FILTERS)}>Limpar</Button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : report && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4 rounded-xl bg-surface p-5 shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-6" />
                </span>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString("pt-BR")}</p>
                  <p className="text-sm text-muted">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl bg-surface shadow-sm">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Escola</th>
                  <th className="px-4 py-3 font-medium">Turma</th>
                  <th className="px-4 py-3 text-right font-medium">Alunos</th>
                  <th className="px-4 py-3 text-right font-medium">Concluíram</th>
                </tr>
              </thead>
              <tbody>
                {report.groups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted">Nenhum aluno jogou ainda.</td>
                  </tr>
                ) : (
                  report.groups.map((g) => (
                    <tr key={`${g.escola}|${g.turma}`} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">{g.escola}</td>
                      <td className="px-4 py-3">{g.turma}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{g.alunos}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{g.concluiram}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

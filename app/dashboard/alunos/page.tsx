"use client";

import { useState } from "react";
import { CircleCheck, CircleX, GraduationCap, School, Users } from "lucide-react";
import { useApiData } from "@/lib/useApiData";
import { formatDate, periodLabel, today, type ExportDocument } from "@/lib/export";
import type { ReportData } from "@/lib/types";
import { Alert, Button, Field, PageTitle, Spinner, inputClass } from "@/components/ui";
import ExportButtons from "@/components/ExportButtons";

type Filters = { escola: string; turma: string; from: string; to: string };
const EMPTY_FILTERS: Filters = { escola: "", turma: "", from: "", to: "" };

function toQuery(filters: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function filtersLabel(f: Filters) {
  return [f.escola && `Escola: ${f.escola}`, f.turma && `Turma: ${f.turma}`, periodLabel(f.from, f.to)].filter(Boolean).join(" · ");
}

function buildExport(report: ReportData, filters: Filters): ExportDocument {
  return {
    title: "Relatório de alunos",
    subtitle: filtersLabel(filters),
    fileName: `alunos-${today()}`,
    sections: [
      {
        title: "Por escola e turma",
        columns: [
          { header: "Escola", width: 40 },
          { header: "Turma", width: 20 },
          { header: "Alunos", numeric: true },
          { header: "Concluíram", numeric: true },
          { header: "Erros", numeric: true },
        ],
        rows: report.groups.map((g) => [g.escola, g.turma, g.alunos, g.concluiram, g.erros]),
      },
      {
        title: "Alunos",
        columns: [
          { header: "Nome", width: 35 },
          { header: "Escola", width: 40 },
          { header: "Turma", width: 20 },
          { header: "Jogou em", width: 14 },
          { header: "Concluiu", width: 12 },
          { header: "Erros", numeric: true },
        ],
        rows: report.alunos.map((a) => [a.name, a.escola, a.turma, formatDate(a.createdAt), a.conclude ? "Sim" : "Não", a.erros]),
      },
    ],
  };
}

export default function AlunosPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const query = toQuery(applied);
  const { data: report, error, loading } = useApiData<ReportData>(`/api/reports${query}`);

  function apply(f: Filters) {
    setFilters(f);
    setApplied(f);
  }

  const cards = report
    ? [
        { label: "Alunos que jogaram", value: report.totals.alunos, icon: Users },
        { label: "Concluíram o quiz", value: report.totals.concluiram, icon: CircleCheck },
        { label: "Escolas", value: report.totals.escolas, icon: School },
        { label: "Turmas", value: report.totals.turmas, icon: GraduationCap },
        { label: "Respostas erradas", value: report.totals.erros, icon: CircleX },
      ]
    : [];

  return (
    <>
      <PageTitle
        title="Alunos"
        description="Quantidade de alunos que jogaram, por escola e turma, e os erros de cada aluno."
        action={<ExportButtons build={() => buildExport(report!, applied)} disabled={!report || loading} />}
      />

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
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                  <th className="px-4 py-3 text-right font-medium">Erros</th>
                </tr>
              </thead>
              <tbody>
                {report.groups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">Nenhum aluno jogou ainda.</td>
                  </tr>
                ) : (
                  report.groups.map((g) => (
                    <tr key={`${g.escola}|${g.turma}`} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">{g.escola}</td>
                      <td className="px-4 py-3">{g.turma}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{g.alunos}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{g.concluiram}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{g.erros}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold">Alunos</h2>
          <div className="overflow-x-auto rounded-xl bg-surface shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Escola</th>
                  <th className="px-4 py-3 font-medium">Turma</th>
                  <th className="px-4 py-3 font-medium">Jogou em</th>
                  <th className="px-4 py-3 font-medium">Concluiu</th>
                  <th className="px-4 py-3 text-right font-medium">Erros</th>
                </tr>
              </thead>
              <tbody>
                {report.alunos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">Nenhum aluno jogou ainda.</td>
                  </tr>
                ) : (
                  report.alunos.map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">{a.name}</td>
                      <td className="px-4 py-3">{a.escola}</td>
                      <td className="px-4 py-3">{a.turma}</td>
                      <td className="px-4 py-3 tabular-nums">{formatDate(a.createdAt)}</td>
                      <td className="px-4 py-3">{a.conclude ? "Sim" : "Não"}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{a.erros}</td>
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

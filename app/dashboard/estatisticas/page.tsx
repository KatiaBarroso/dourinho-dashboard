"use client";

import { useState } from "react";
import { CircleX, Users } from "lucide-react";
import { useApiData } from "@/lib/useApiData";
import { periodLabel, today, type ExportDocument, type ExportSection } from "@/lib/export";
import type { StatsData } from "@/lib/types";
import { Alert, Button, Field, PageTitle, Spinner, inputClass } from "@/components/ui";
import ExportButtons from "@/components/ExportButtons";

type Period = { from: string; to: string };
const EMPTY_PERIOD: Period = { from: "", to: "" };

type View = "stages" | "questions" | "escolas";
const VIEWS: { id: View; label: string; title: string }[] = [
  { id: "stages", label: "Estágios", title: "Erros por estágio" },
  { id: "questions", label: "Questões", title: "Erros por questão" },
  { id: "escolas", label: "Escolas", title: "Erros por escola" },
];

// Linhas do ranking na visão escolhida: nome, estágio (só nas questões) e quantidade de erros.
type RankRow = { key: string; name: string; stage?: string; erros: number };

function rankRows(stats: StatsData, view: View): RankRow[] {
  if (view === "stages") return stats.stages.map((s) => ({ key: String(s.id), name: s.stagename, erros: s.erros }));
  if (view === "questions") return stats.questions.map((q) => ({ key: q.id, name: q.question, stage: q.stagename, erros: q.erros }));
  return stats.escolas.map((e) => ({ key: e.escola, name: e.escola, erros: e.erros }));
}

const NAME_HEADER: Record<View, string> = { stages: "Estágio", questions: "Enunciado", escolas: "Escola" };

function percent(value: number, total: number) {
  return total ? `${((value / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "0%";
}

export default function EstatisticasPage() {
  const [period, setPeriod] = useState<Period>(EMPTY_PERIOD);
  const [applied, setApplied] = useState<Period>(EMPTY_PERIOD);
  const [view, setView] = useState<View>("stages");

  const params = new URLSearchParams();
  if (applied.from) params.set("from", applied.from);
  if (applied.to) params.set("to", applied.to);
  const query = params.toString();
  const { data: stats, error, loading } = useApiData<StatsData>(`/api/statistics${query ? `?${query}` : ""}`);

  function apply(p: Period) {
    setPeriod(p);
    setApplied(p);
  }

  const current = VIEWS.find((v) => v.id === view)!;
  const rows = stats ? rankRows(stats, view) : [];
  const total = stats?.totals.erros ?? 0;
  const withStage = view === "questions";

  function buildExport(): ExportDocument {
    const section: ExportSection = {
      title: current.title,
      columns: [
        { header: "#", numeric: true, width: 6 },
        { header: NAME_HEADER[view], width: withStage ? 70 : 45 },
        ...(withStage ? [{ header: "Estágio", width: 35 }] : []),
        { header: "Erros", numeric: true },
        { header: "% do total", numeric: true },
      ],
      rows: rows.map((r, i) => [i + 1, r.name, ...(withStage ? [r.stage ?? ""] : []), r.erros, percent(r.erros, total)]),
    };
    return {
      title: `Estatísticas de erros — ${current.label}`,
      subtitle: `${periodLabel(applied.from, applied.to)} · Total de erros: ${total.toLocaleString("pt-BR")}`,
      fileName: `estatisticas-${view}-${today()}`,
      sections: [section],
    };
  }

  const cards = stats
    ? [
        { label: "Respostas erradas", value: stats.totals.erros, icon: CircleX },
        { label: "Alunos que erraram", value: stats.totals.alunos, icon: Users },
      ]
    : [];

  return (
    <>
      <PageTitle
        title="Estatísticas"
        description="Onde os alunos mais erram: por estágio, questão e escola."
        action={<ExportButtons build={buildExport} disabled={!stats || loading} />}
      />

      <form
        className="mb-6 grid gap-4 rounded-xl bg-surface p-4 shadow-sm sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          apply(period);
        }}
      >
        <Field label="De">
          {(id) => <input id={id} type="date" className={inputClass} value={period.from} onChange={(e) => setPeriod({ ...period, from: e.target.value })} />}
        </Field>
        <Field label="Até">
          {(id) => <input id={id} type="date" className={inputClass} value={period.to} onChange={(e) => setPeriod({ ...period, to: e.target.value })} />}
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">Filtrar</Button>
          <Button type="button" variant="secondary" onClick={() => apply(EMPTY_PERIOD)}>Limpar</Button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : stats && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
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

          <div role="tablist" aria-label="Agrupar erros por" className="mb-4 inline-flex rounded-lg bg-surface p-1 shadow-sm">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${view === v.id ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"}`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl bg-surface shadow-sm">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="w-12 px-4 py-3 text-right font-medium">#</th>
                  <th className="px-4 py-3 font-medium">{NAME_HEADER[view]}</th>
                  {withStage && <th className="px-4 py-3 font-medium">Estágio</th>}
                  <th className="px-4 py-3 text-right font-medium">Erros</th>
                  <th className="px-4 py-3 text-right font-medium">% do total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={withStage ? 5 : 4} className="px-4 py-10 text-center text-muted">Nenhum erro registrado no período.</td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.key} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-right tabular-nums text-muted">{i + 1}</td>
                      <td className="px-4 py-3">{r.name}</td>
                      {withStage && <td className="px-4 py-3 text-muted">{r.stage}</td>}
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{r.erros.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">{percent(r.erros, total)}</td>
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

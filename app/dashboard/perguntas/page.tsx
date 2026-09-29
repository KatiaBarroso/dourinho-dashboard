"use client";

import { useCallback, useState } from "react";
import { ChevronRight, CircleCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import { GAME_QUESTIONS_PER_STAGE, type Question, type Stage } from "@/lib/types";
import { Alert, Button, ConfirmDialog, Modal, PageTitle, Spinner } from "@/components/ui";
import { QuestionForm, StageSelect, stageLabel } from "@/components/QuestionForms";

// Qual modal está aberto: detalhe da questão, edição ou nova questão.
type View = { kind: "detail"; question: Question } | { kind: "edit"; question: Question } | { kind: "create" } | null;

export default function PerguntasPage() {
  const [stageFilter, setStageFilter] = useState(0);
  const { data: stagesData, error: stagesError } = useApiData<{ stages: Stage[] }>("/api/stages");
  const { data, error, loading, reload } = useApiData<{ questions: Question[] }>(`/api/questions?idStage=${stageFilter}`);
  const stages = stagesData?.stages ?? [];
  const questions = data?.questions ?? [];

  const [view, setView] = useState<View>(null);
  const [toDelete, setToDelete] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const closeView = useCallback(() => setView(null), []);
  const closeConfirm = useCallback(() => {
    setToDelete(null);
    setDeleteError(null);
  }, []);

  function handleSaved() {
    setView(null);
    reload();
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api(`/api/deletequestion?id=${toDelete.id}`, { method: "DELETE" });
      setToDelete(null);
      setView(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro ao excluir.");
    } finally {
      setDeleting(false);
    }
  }

  const stageName = (id: number) => {
    const stage = stages.find((s) => s.id === id);
    return stage ? stageLabel(stage) : `Estágio ${id}`;
  };
  return (
    <>
      <PageTitle
        title="Perguntas"
        description={`Cadastre quantas questões quiser por estágio. A cada partida, o game sorteia ${GAME_QUESTIONS_PER_STAGE} de cada estágio.`}
        action={
          <Button onClick={() => setView({ kind: "create" })} disabled={stages.length === 0}>
            <Plus className="size-4" /> Nova questão
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor="stage-filter" className="text-sm font-medium">Estágio</label>
        <div className="w-full sm:w-96">
          <StageSelect id="stage-filter" stages={stages} value={stageFilter} onChange={setStageFilter} />
        </div>
        {data && (
          <span className="text-sm text-muted">
            {questions.length} {questions.length === 1 ? "questão cadastrada" : "questões cadastradas"}
          </span>
        )}
      </div>
      {data && questions.length > 0 && questions.length < GAME_QUESTIONS_PER_STAGE && (
        <p className="mb-4 text-sm text-danger">
          O game sorteia {GAME_QUESTIONS_PER_STAGE} questões por estágio. Cadastre pelo menos mais{" "}
          {GAME_QUESTIONS_PER_STAGE - questions.length} para este estágio ficar completo.
        </p>
      )}

      {(error || stagesError) && <Alert>{error ?? stagesError}</Alert>}

      {loading ? (
        <Spinner />
      ) : questions.length === 0 ? (
        <div className="rounded-xl bg-surface p-10 text-center text-muted shadow-sm">
          Nenhuma questão neste estágio.{" "}
          <button className="font-medium text-primary hover:underline" onClick={() => setView({ kind: "create" })}>
            Cadastrar a primeira
          </button>
        </div>
      ) : (
        <ol className="space-y-2">
          {questions.map((q, i) => (
            <li key={q.id}>
              <button
                onClick={() => setView({ kind: "detail", question: q })}
                className="flex w-full items-center gap-4 rounded-xl bg-surface p-4 text-left shadow-sm transition hover:ring-2 hover:ring-primary/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2">{q.question}</span>
                  <span className="mt-1 block truncate text-xs text-muted">
                    Resposta certa: {q.answers.find((a) => a.isCorrect)?.answer ?? "—"}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted" />
              </button>
            </li>
          ))}
        </ol>
      )}

      {/* Detalhe da questão */}
      <Modal title="Detalhe da questão" open={view?.kind === "detail"} onClose={closeView} wide>
        {view?.kind === "detail" && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">{stageName(view.question.idStage)}</p>
              <p className="mt-2 text-lg">{view.question.question}</p>
            </div>
            <ul className="space-y-2">
              {view.question.answers.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                    a.isCorrect ? "border-accent bg-accent-soft" : "border-line"
                  }`}
                >
                  <span>{a.answer}</span>
                  {a.isCorrect && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent">
                      <CircleCheck className="size-4" /> Resposta certa
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="danger" onClick={() => setToDelete(view.question)}>
                <Trash2 className="size-4" /> Excluir
              </Button>
              <Button onClick={() => setView({ kind: "edit", question: view.question })}>
                <Pencil className="size-4" /> Editar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Nova questão / edição */}
      <Modal title={view?.kind === "edit" ? "Editar questão" : "Nova questão"} open={view?.kind === "create" || view?.kind === "edit"} onClose={closeView} wide>
        {(view?.kind === "create" || view?.kind === "edit") && (
          <QuestionForm
            key={view.kind === "edit" ? view.question.id : "new"}
            stages={stages}
            question={view.kind === "edit" ? view.question : undefined}
            defaultStage={stageFilter}
            onCancel={closeView}
            onSaved={handleSaved}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir questão"
        message={<>Tem certeza que deseja excluir esta questão e suas 4 respostas? Essa ação não pode ser desfeita.</>}
        confirmLabel="Excluir"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={closeConfirm}
      />
    </>
  );
}

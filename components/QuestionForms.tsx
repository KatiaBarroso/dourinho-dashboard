"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/formErrors";
import { ANSWERS_PER_QUESTION, MIN_TEXT_LENGTH, type Question, type Stage } from "@/lib/types";
import { createQuestionSchema, updateQuestionSchema } from "@/lib/validators";
import { Alert, Button, Field, inputClass } from "@/components/ui";

export const stageLabel = (stage: Stage) => `${stage.id} - ${stage.stagename}`;

/** Caixa de seleção com os 5 estágios (índices 0 a 4). */
export function StageSelect({
  id,
  stages,
  value,
  onChange,
  className = "",
}: {
  id?: string;
  stages: Stage[];
  value: number;
  onChange: (idStage: number) => void;
  className?: string;
}) {
  return (
    <select id={id} className={`${inputClass} ${className}`} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {stages.map((s) => (
        <option key={s.id} value={s.id}>
          {stageLabel(s)}
        </option>
      ))}
    </select>
  );
}

function Counter({ value }: { value: string }) {
  const length = value.trim().length;
  return (
    <span className={length < MIN_TEXT_LENGTH ? "text-danger" : "text-muted"}>
      {length} caracteres (mínimo {MIN_TEXT_LENGTH})
    </span>
  );
}

type AnswerDraft = { id?: string; answer: string; isCorrect: boolean };

const emptyAnswers = (): AnswerDraft[] => Array.from({ length: ANSWERS_PER_QUESTION }, () => ({ answer: "", isCorrect: false }));

/** Formulário de nova questão ou de edição (enunciado, estágio e as 4 respostas). */
export function QuestionForm({
  stages,
  question,
  defaultStage,
  onCancel,
  onSaved,
}: {
  stages: Stage[];
  question?: Question;
  defaultStage: number;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const editing = question !== undefined;
  const [idStage, setIdStage] = useState(question?.idStage ?? defaultStage);
  const [text, setText] = useState(question?.question ?? "");
  const [answers, setAnswers] = useState<AnswerDraft[]>(
    question ? question.answers.map((a) => ({ ...a })) : emptyAnswers(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function setAnswerText(index: number, value: string) {
    setAnswers(answers.map((a, i) => (i === index ? { ...a, answer: value } : a)));
  }

  // "Resposta certa" é exclusiva: marcar uma desmarca as demais.
  function setCorrect(index: number, checked: boolean) {
    setAnswers(answers.map((a, i) => ({ ...a, isCorrect: i === index ? checked : checked ? false : a.isCorrect })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const body = editing
      ? { id: question.id, idStage, question: text, answers }
      : { idStage, question: text, answers: answers.map(({ answer, isCorrect }) => ({ answer, isCorrect })) };
    const result = editing ? updateQuestionSchema.safeParse(body) : createQuestionSchema.safeParse(body);
    const found = fieldErrors(result);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await api(editing ? "/api/updatequestion" : "/api/createquestion", { method: editing ? "PUT" : "POST", body });
      onSaved();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erro ao salvar.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field label="Estágio" error={errors.idStage}>
        {(id) => <StageSelect id={id} stages={stages} value={idStage} onChange={setIdStage} />}
      </Field>

      <Field label="Título (enunciado da questão)" error={errors.question} hint={<Counter value={text} />}>
        {(id) => (
          <textarea
            id={id}
            className={`${inputClass} min-h-24`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={!!errors.question}
            placeholder="Ex.: Qual atitude ajuda a preservar a mata ciliar?"
          />
        )}
      </Field>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Respostas</legend>
        {answers.map((a, i) => {
          const error = errors[`answers.${i}.answer`];
          return (
            <div key={a.id ?? i} className={`space-y-2 rounded-lg border p-3 ${a.isCorrect ? "border-accent bg-accent-soft/50" : "border-line"}`}>
              <Field label={`Resposta ${i + 1}`} error={error} hint={<Counter value={a.answer} />}>
                {(id) => (
                  <input id={id} className={inputClass} value={a.answer} onChange={(e) => setAnswerText(i, e.target.value)} aria-invalid={!!error} />
                )}
              </Field>
              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={a.isCorrect} onChange={(e) => setCorrect(i, e.target.checked)} className="size-4 accent-accent" />
                Resposta certa
              </label>
            </div>
          );
        })}
        {errors.answers && <p className="text-sm text-danger">{errors.answers}</p>}
      </fieldset>

      {serverError && <Alert>{serverError}</Alert>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  );
}

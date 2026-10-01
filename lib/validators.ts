import { z } from "zod";
import { ANSWERS_PER_QUESTION, MIN_TEXT_LENGTH } from "./types";

const text = (field: string, min = 1, max = 500) =>
  z
    .string({ error: `${field} é obrigatório.` })
    .trim()
    .min(min, min > 1 ? `${field} deve ter pelo menos ${min} caracteres.` : `${field} é obrigatório.`)
    .max(max, `${field} é muito longo.`);

const uuid = (field = "id") => z.uuid({ error: `${field} inválido.` });
const idStage = z.coerce
  .number({ error: "Estágio inválido." })
  .int("Estágio inválido.")
  .min(0, "Estágio inválido.")
  .max(4, "Estágio inválido.");
const email = z.string({ error: "E-mail é obrigatório." }).trim().toLowerCase().pipe(z.email({ error: "E-mail inválido." }));
const password = z
  .string({ error: "Senha é obrigatória." })
  .min(6, "A senha deve ter pelo menos 6 caracteres.")
  .max(72, "Senha muito longa.");

export const signInSchema = z.object({
  email: z.string({ error: "Informe o e-mail." }).trim().toLowerCase().min(1, "Informe o e-mail."),
  password: z.string({ error: "Informe a senha." }).min(1, "Informe a senha."),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string({ error: "Informe a senha atual." }).min(1, "Informe a senha atual."),
  newPassword: password,
});

// ---- Questões e respostas ----

const questionText = text("O enunciado", MIN_TEXT_LENGTH, 1000);
const answerText = text("A resposta", MIN_TEXT_LENGTH);

const exactlyOneCorrect = (answers: { isCorrect: boolean }[]) => answers.filter((a) => a.isCorrect).length === 1;
const ONE_CORRECT_MESSAGE = "Marque exatamente 1 resposta certa.";

export const createQuestionSchema = z.object({
  idStage,
  question: questionText,
  answers: z
    .array(z.object({ answer: answerText, isCorrect: z.boolean() }))
    .length(ANSWERS_PER_QUESTION, `A questão deve ter exatamente ${ANSWERS_PER_QUESTION} respostas.`)
    .refine(exactlyOneCorrect, ONE_CORRECT_MESSAGE),
});

export const updateQuestionSchema = z.object({
  id: uuid(),
  idStage: idStage.optional(),
  question: questionText.optional(),
  // Opcional: as 4 respostas existentes, editadas junto com a questão.
  answers: z
    .array(z.object({ id: uuid("id da resposta"), answer: answerText, isCorrect: z.boolean() }))
    .length(ANSWERS_PER_QUESTION, `A questão deve ter exatamente ${ANSWERS_PER_QUESTION} respostas.`)
    .refine(exactlyOneCorrect, ONE_CORRECT_MESSAGE)
    .optional(),
});

export const createAnswerSchema = z.object({
  idQuestion: uuid("idQuestion"),
  answer: answerText,
  isCorrect: z.boolean().default(false),
});

export const updateAnswerSchema = z.object({
  id: uuid(),
  answer: answerText.optional(),
  isCorrect: z.boolean().optional(),
});

export const idSchema = z.object({ id: uuid() });

// ---- Alunos (game) ----

export const registerPlaySchema = z.object({
  name: text("Nome do aluno", 1, 120),
  turma: text("Turma", 1, 60),
  escola: text("Escola", 1, 160),
  conclude: z.boolean().default(false),
});

export const concludePlaySchema = z.object({
  id: uuid(),
  conclude: z.boolean(),
});

// Estágio e escola são preenchidos pelo servidor a partir da questão e do aluno.
export const registerErrorSchema = z.object({
  idUser: uuid("idUser"),
  idQuestion: uuid("idQuestion"),
});

// ---- Colaboradores ----

export const createColaboradorSchema = z.object({
  name: text("O nome", 6, 120),
  email,
  position: text("O cargo", 6, 80),
  password,
});

export const updateColaboradorSchema = z.object({
  id: uuid(),
  name: text("O nome", 6, 120).optional(),
  email: email.optional(),
  position: text("O cargo", 6, 80).optional(),
  password: password.optional(),
});

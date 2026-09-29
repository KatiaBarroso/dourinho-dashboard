import type { ZodSafeParseResult } from "zod";

/** Converte os erros do zod em { "campo": "mensagem" } (ex.: "answers.2.answer"). Mantém o 1º erro de cada campo. */
export function fieldErrors(result: ZodSafeParseResult<unknown>): Record<string, string> {
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    errors[key] ??= issue.message;
  }
  return errors;
}

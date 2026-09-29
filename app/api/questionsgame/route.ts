import { NextResponse } from "next/server";
import { dbError } from "@/lib/http";
import { fetchQuestions, fetchStages } from "@/lib/questions";
import { shuffle } from "@/lib/shuffle";
import { GAME_QUESTIONS_PER_STAGE, type GameStage } from "@/lib/types";

// Pública: questões para o game, agrupadas nos 5 estágios (0 a 4), em ordem.
// A cada chamada sorteia 5 questões de cada estágio e embaralha as respostas de cada questão.
export async function GET() {
  const [stages, questions] = await Promise.all([fetchStages(), fetchQuestions()]);
  if ("error" in stages) return dbError(stages.error);
  if ("error" in questions) return dbError(questions.error);

  const result: GameStage[] = stages.data.map((stage) => ({
    ...stage,
    questions: shuffle(questions.data.filter((q) => q.idStage === stage.id))
      .slice(0, GAME_QUESTIONS_PER_STAGE)
      .map((q) => ({ id: q.id, question: q.question, answers: shuffle(q.answers) })),
  }));

  return NextResponse.json({ stages: result }, { headers: { "Cache-Control": "no-store" } });
}

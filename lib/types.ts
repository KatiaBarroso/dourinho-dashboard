// Tipos compartilhados entre API e telas (campos iguais às colunas do banco).

export const GAME_QUESTIONS_PER_STAGE = 5; // sorteadas por estágio no questionsgame
export const ANSWERS_PER_QUESTION = 4;
export const MIN_TEXT_LENGTH = 10;

export type Stage = {
  id: number;
  stagename: string;
};

export type Answer = {
  id: string;
  answer: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  question: string;
  idStage: number;
  createdAt: string;
  answers: Answer[];
};

export type GameStage = Stage & {
  questions: { id: string; question: string; answers: Answer[] }[];
};

export type Colaborador = {
  id: string;
  name: string;
  email: string;
  position: string;
  createdAt: string;
};

export type ReportGroup = {
  escola: string;
  turma: string;
  alunos: number;
  concluiram: number;
  erros: number;
};

export type ReportData = {
  totals: { alunos: number; concluiram: number; escolas: number; turmas: number; erros: number };
  groups: ReportGroup[];
  alunos: ReportAluno[];
  filters: { escolas: string[]; turmas: string[] };
};

export type ReportAluno = {
  id: string;
  name: string;
  escola: string;
  turma: string;
  conclude: boolean;
  createdAt: string;
  erros: number;
};

export type StatsData = {
  totals: { erros: number; alunos: number };
  stages: { id: number; stagename: string; erros: number }[];
  questions: { id: string; question: string; stagename: string; erros: number }[];
  escolas: { escola: string; erros: number }[];
};

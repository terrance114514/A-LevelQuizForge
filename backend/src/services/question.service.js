import { questionBank } from "../data/questionBank.js";
import { toClampedInteger } from "../utils/validate.js";

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sanitizeQuestion(question) {
  return {
    id: question.id,
    board: question.board,
    subject: question.subject,
    paper: question.paper,
    difficulty: question.difficulty,
    topic: question.topic,
    stem: question.stem,
    options: question.options,
  };
}

export function generatePaper(selection, options) {
  const topics = Array.isArray(options.topics) ? options.topics : [];
  const requestedCount = toClampedInteger(options.count, 8, 1, 30);
  const difficulty = options.difficulty || "";

  let pool = questionBank.filter(
    (q) =>
      q.board === selection.board &&
      q.subject === selection.subject &&
      q.paper === selection.paper
  );

  if (difficulty || topics.length) {
    const refined = pool.filter(
      (q) => q.difficulty === difficulty || topics.includes(q.topic)
    );
    if (refined.length) {
      pool = refined;
    }
  }

  let fallbackApplied = false;
  if (!pool.length) {
    fallbackApplied = true;
    pool = questionBank.filter(
      (q) => q.board === selection.board && q.subject === selection.subject
    );
  }

  return {
    questions: shuffle(pool).slice(0, requestedCount),
    totalCandidates: pool.length,
    requestedCount,
    fallbackApplied,
  };
}

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

const DEFAULT_DIFFICULTY_TARGET = {
  "基础": 0.4,
  "中等": 0.4,
  "冲刺": 0.2,
};

function buildDifficultyTargets(total, preferredDifficulty) {
  if (preferredDifficulty && DEFAULT_DIFFICULTY_TARGET[preferredDifficulty] != null) {
    const targets = { "基础": 0, "中等": 0, "冲刺": 0 };
    targets[preferredDifficulty] = total;
    return targets;
  }

  const raw = Object.entries(DEFAULT_DIFFICULTY_TARGET).map(([key, ratio]) => ({
    key,
    exact: ratio * total,
  }));
  const targets = { "基础": 0, "中等": 0, "冲刺": 0 };
  let assigned = 0;
  raw.forEach((row) => {
    const count = Math.floor(row.exact);
    targets[row.key] = count;
    assigned += count;
  });
  const remain = total - assigned;
  const sortedByRemainder = raw
    .map((x) => ({ ...x, remainder: x.exact - Math.floor(x.exact) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < remain; i += 1) {
    targets[sortedByRemainder[i % sortedByRemainder.length].key] += 1;
  }
  return targets;
}

function pickWithoutTemplateDup(pool, limit, usedTemplateIds) {
  if (limit <= 0) return [];
  const picked = [];
  const backup = [];

  pool.forEach((question) => {
    const templateId = question.templateId || question.id;
    if (usedTemplateIds.has(templateId)) {
      backup.push(question);
      return;
    }
    picked.push(question);
    usedTemplateIds.add(templateId);
  });

  if (picked.length >= limit) {
    return picked.slice(0, limit);
  }

  for (let i = 0; i < backup.length && picked.length < limit; i += 1) {
    picked.push(backup[i]);
  }
  return picked;
}

export function sanitizeQuestion(question) {
  return {
    id: question.id,
    board: question.board,
    subject: question.subject,
    paper: question.paper,
    difficulty: question.difficulty,
    topic: question.topic,
    skills: Array.isArray(question.skills) ? question.skills : [],
    hints: Array.isArray(question.hints) ? question.hints : [],
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
    const refined = pool.filter((q) => {
      const matchesDifficulty = difficulty ? q.difficulty === difficulty : false;
      const matchesTopic = topics.length ? topics.includes(q.topic) : false;
      return matchesDifficulty || matchesTopic;
    });
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

  const shuffled = shuffle(pool);
  const difficultyTargets = buildDifficultyTargets(requestedCount, difficulty);
  const usedTemplateIds = new Set();
  const selected = [];

  Object.entries(difficultyTargets).forEach(([difficultyKey, limit]) => {
    const bucket = shuffled.filter((q) => q.difficulty === difficultyKey);
    selected.push(...pickWithoutTemplateDup(bucket, limit, usedTemplateIds));
  });

  if (selected.length < requestedCount) {
    selected.push(
      ...pickWithoutTemplateDup(
        shuffled.filter((q) => !selected.includes(q)),
        requestedCount - selected.length,
        usedTemplateIds
      )
    );
  }

  const topicCoverageCount = new Set(selected.map((q) => q.topic)).size;

  return {
    questions: selected.slice(0, requestedCount),
    totalCandidates: pool.length,
    requestedCount,
    fallbackApplied,
    topicCoverageCount,
  };
}

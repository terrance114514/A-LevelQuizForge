import { randomUUID } from "node:crypto";
import {
  createPracticeSession,
  getPracticeSessionById,
  listPracticeSessionsByUserId,
  submitPracticeSession,
} from "../db/repositories/practice.repository.js";
import { isDbEnabled } from "../db/client.js";

const PAPER_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_PAPER_RECORDS = 500;
const paperStore = new Map();

function pruneExpired() {
  const now = Date.now();
  for (const [id, record] of paperStore.entries()) {
    if (now - record.createdAt > PAPER_TTL_MS) {
      paperStore.delete(id);
    }
  }
}

function evictOldestIfNeeded() {
  if (paperStore.size < MAX_PAPER_RECORDS) return;
  const oldest = [...paperStore.entries()].sort(
    (a, b) => a[1].createdAt - b[1].createdAt
  )[0];
  if (oldest) {
    paperStore.delete(oldest[0]);
  }
}

function toMemoryRecord(input) {
  return {
    paperId: input.paperId,
    userId: input.userId || null,
    selection: input.selection,
    options: input.options,
    questions: input.questions,
    fallbackApplied: Boolean(input.fallbackApplied),
    createdAt: Date.now(),
    submittedAt: null,
    status: "generated",
  };
}

function toRecordShapeFromDb(row) {
  return {
    paperId: row.id,
    userId: row.userId,
    selection: {
      grade: row.grade || "",
      board: row.board,
      subject: row.subject,
      paper: row.paper,
    },
    options: {
      count: row.requestedCount,
      difficulty: row.difficulty || "",
      topics: row.topics || [],
    },
    questions: row.generatedQuestions || [],
    result: row.result,
    wrongLog: row.wrongLog,
    fallbackApplied: Boolean(row.fallbackApplied),
    createdAt: row.createdAt,
    submittedAt: row.submittedAt,
    status: row.status,
  };
}

export async function saveGeneratedPaper(input) {
  if (isDbEnabled()) {
    const session = await createPracticeSession({
      userId: input.userId,
      selection: input.selection,
      options: input.options,
      questions: input.questions,
      fallbackApplied: input.fallbackApplied,
    });
    return session.id;
  }

  pruneExpired();
  evictOldestIfNeeded();

  const paperId = randomUUID();
  paperStore.set(
    paperId,
    toMemoryRecord({
      paperId,
      userId: input.userId,
      selection: input.selection,
      options: input.options,
      questions: input.questions,
      fallbackApplied: input.fallbackApplied,
    })
  );
  return paperId;
}

export async function getGeneratedPaper(paperId) {
  if (isDbEnabled()) {
    const row = await getPracticeSessionById(paperId);
    return row ? toRecordShapeFromDb(row) : null;
  }

  pruneExpired();
  return paperStore.get(paperId) || null;
}

export async function markPaperSubmitted(input) {
  if (isDbEnabled()) {
    const row = await submitPracticeSession({
      sessionId: input.paperId,
      answers: input.answers,
      result: input.result,
      wrongLog: input.wrongLog,
    });
    return row ? toRecordShapeFromDb(row) : null;
  }

  pruneExpired();
  const existing = paperStore.get(input.paperId);
  if (!existing) return null;

  const next = {
    ...existing,
    answers: input.answers,
    result: input.result,
    wrongLog: input.wrongLog,
    status: "submitted",
    submittedAt: Date.now(),
  };
  paperStore.set(input.paperId, next);
  return next;
}

export async function listUserPracticeRecords(userId, limit = 20) {
  if (isDbEnabled()) {
    const rows = await listPracticeSessionsByUserId(userId, limit);
    return rows.map(toRecordShapeFromDb);
  }

  pruneExpired();
  return [...paperStore.values()]
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

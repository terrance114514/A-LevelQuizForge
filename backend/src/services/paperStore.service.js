import { randomUUID } from "node:crypto";

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

export function saveGeneratedPaper(selection, questions) {
  pruneExpired();
  evictOldestIfNeeded();

  const paperId = randomUUID();
  paperStore.set(paperId, {
    paperId,
    selection,
    questions,
    createdAt: Date.now(),
  });
  return paperId;
}

export function getGeneratedPaper(paperId) {
  pruneExpired();
  return paperStore.get(paperId) || null;
}

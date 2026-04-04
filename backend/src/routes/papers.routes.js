import { Router } from "express";
import { ApiError } from "../utils/http.js";
import { requireArray, requireString, toClampedInteger, toStringArray } from "../utils/validate.js";
import { buildAnalysis } from "../services/analysis.service.js";
import { evaluatePaper, buildWrongLog } from "../services/evaluation.service.js";
import { saveGeneratedPaper, getGeneratedPaper } from "../services/paperStore.service.js";
import { generatePaper, sanitizeQuestion } from "../services/question.service.js";

const router = Router();

function extractSelection(body) {
  const selection = body.selection || body;
  return {
    grade: typeof selection.grade === "string" ? selection.grade.trim() : "",
    board: requireString(selection.board, "selection.board"),
    subject: requireString(selection.subject, "selection.subject"),
    paper: requireString(selection.paper, "selection.paper"),
  };
}

function extractGenerateOptions(body) {
  const options = body.options || body;
  return {
    count: toClampedInteger(options.count, 8, 1, 30),
    difficulty: typeof options.difficulty === "string" ? options.difficulty.trim() : "",
    topics: toStringArray(options.topics),
  };
}

router.post("/generate", (req, res) => {
  const selection = extractSelection(req.body || {});
  const options = extractGenerateOptions(req.body || {});

  const generated = generatePaper(selection, options);
  const paperId = generated.questions.length
    ? saveGeneratedPaper(selection, generated.questions)
    : null;

  res.json({
    ok: true,
    data: {
      paperId,
      selection,
      requestedCount: generated.requestedCount,
      totalCandidates: generated.totalCandidates,
      fallbackApplied: generated.fallbackApplied,
      questions: generated.questions.map(sanitizeQuestion),
    },
  });
});

router.post("/submit", (req, res) => {
  const body = req.body || {};
  const paperId = requireString(body.paperId, "paperId");
  const answers = requireArray(body.answers, "answers");

  const paperRecord = getGeneratedPaper(paperId);
  if (!paperRecord) {
    throw new ApiError(404, "Paper not found or expired. Please generate a new paper.", "PAPER_NOT_FOUND");
  }

  if (answers.length !== paperRecord.questions.length) {
    throw new ApiError(
      400,
      `Answers length (${answers.length}) does not match question count (${paperRecord.questions.length}).`,
      "INVALID_ANSWERS_LENGTH"
    );
  }

  const result = evaluatePaper(paperRecord.questions, answers);
  const wrongLog = buildWrongLog(result.details);
  const analysis = buildAnalysis({ wrongLog, lastResult: result });

  res.json({
    ok: true,
    data: {
      paperId,
      result,
      wrongLog,
      analysis,
    },
  });
});

export default router;

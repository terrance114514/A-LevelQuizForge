import { Router } from "express";
import { ApiError } from "../utils/http.js";
import { requireArray, requireString, toClampedInteger, toStringArray } from "../utils/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildAnalysis } from "../services/analysis.service.js";
import { evaluatePaper, buildWrongLog } from "../services/evaluation.service.js";
import { saveGeneratedPaper, getGeneratedPaper, markPaperSubmitted } from "../services/paperStore.service.js";
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

router.post("/generate", asyncHandler(async (req, res) => {
  const selection = extractSelection(req.body || {});
  const options = extractGenerateOptions(req.body || {});
  const userId = typeof req.body?.userId === "string" ? req.body.userId.trim() : "";

  const generated = generatePaper(selection, options);
  const paperId = generated.questions.length
    ? await saveGeneratedPaper({
      userId: userId || null,
      selection,
      options,
      questions: generated.questions,
      fallbackApplied: generated.fallbackApplied,
    })
    : null;

  res.json({
    ok: true,
    data: {
      paperId,
      userId: userId || null,
      selection,
      requestedCount: generated.requestedCount,
      totalCandidates: generated.totalCandidates,
      fallbackApplied: generated.fallbackApplied,
      questions: generated.questions.map(sanitizeQuestion),
    },
  });
}));

router.post("/submit", asyncHandler(async (req, res) => {
  const body = req.body || {};
  const paperId = requireString(body.paperId, "paperId");
  const answers = requireArray(body.answers, "answers");

  const paperRecord = await getGeneratedPaper(paperId);
  if (!paperRecord) {
    throw new ApiError(404, "Paper not found or expired. Please generate a new paper.", "PAPER_NOT_FOUND");
  }

  if (paperRecord.status === "submitted") {
    throw new ApiError(409, "This paper has already been submitted.", "PAPER_ALREADY_SUBMITTED");
  }

  if (answers.length !== paperRecord.questions.length) {
    throw new ApiError(
      400,
      `Answers length (${answers.length}) does not match question count (${paperRecord.questions.length}).`,
      "INVALID_ANSWERS_LENGTH"
    );
  }

  const normalizedAnswers = answers.map((item) => {
    if (Number.isInteger(item)) {
      return item;
    }
    if (item && typeof item === "object" && Number.isInteger(item.selectedIndex)) {
      return item.selectedIndex;
    }
    return -1;
  });

  const result = evaluatePaper(paperRecord.questions, normalizedAnswers);
  result.hintUsedQuestions = answers.filter((item) => item && typeof item === "object" && Number(item.hintsUsed || 0) > 0).length;
  result.totalHintClicks = answers.reduce((sum, item) => {
    if (item && typeof item === "object") {
      return sum + Number(item.hintsUsed || 0);
    }
    return sum;
  }, 0);
  const wrongLog = buildWrongLog(result.details);
  const analysis = buildAnalysis({ wrongLog, lastResult: result });
  await markPaperSubmitted({
    paperId,
    answers: normalizedAnswers,
    result,
    wrongLog,
  });

  res.json({
    ok: true,
    data: {
      paperId,
      result,
      wrongLog,
      analysis,
    },
  });
}));

export default router;

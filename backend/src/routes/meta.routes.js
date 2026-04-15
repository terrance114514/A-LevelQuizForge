import { Router } from "express";
import { curriculumData } from "../data/curriculum.js";
import { questionBank } from "../data/questionBank.js";
import { isDbEnabled } from "../db/client.js";

const router = Router();

router.get("/curriculum", (_req, res) => {
  res.json({
    ok: true,
    data: curriculumData,
  });
});

router.get("/stats", (_req, res) => {
  const boardCounts = questionBank.reduce((acc, question) => {
    acc[question.board] = (acc[question.board] || 0) + 1;
    return acc;
  }, {});

  const subjectCounts = questionBank.reduce((acc, question) => {
    acc[question.subject] = (acc[question.subject] || 0) + 1;
    return acc;
  }, {});

  res.json({
    ok: true,
    data: {
      totalQuestions: questionBank.length,
      boardCounts,
      subjectCounts,
    },
  });
});

router.get("/storage", (_req, res) => {
  res.json({
    ok: true,
    data: {
      mode: isDbEnabled() ? "postgresql" : "memory",
    },
  });
});

export default router;

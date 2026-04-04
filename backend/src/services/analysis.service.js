import { sampleWrongLog } from "../data/questionBank.js";

function calcWrongRate(row) {
  const total = (row.correct || 0) + (row.wrong || 0);
  return total ? (row.wrong / total) * 100 : 0;
}

export function buildAnalysis(input = {}) {
  const logs = Array.isArray(input.wrongLog) && input.wrongLog.length
    ? input.wrongLog
    : sampleWrongLog;
  const lastResult = input.lastResult || null;

  const bars = logs.map((row) => ({
    topic: row.topic,
    mistake: row.mistake,
    wrongRate: Number(calcWrongRate(row).toFixed(1)),
  }));

  const sorted = [...logs].sort((a, b) => calcWrongRate(b) - calcWrongRate(a));
  const weakTopics = sorted
    .slice(0, 2)
    .map((x) => x.topic)
    .join("、") || "基础模块";

  const advices = [
    `7天短期：优先复习 ${weakTopics}，每天20分钟概念回顾 + 4道定向训练。`,
    "30天长期：每周一次限时小测，建立错因标签（概念/计算/审题）并复盘。",
    "策略建议：先做基础题保证正确率，再逐步增加冲刺题比例至40%。",
  ];

  if (lastResult && typeof lastResult.accuracy === "number" && lastResult.accuracy < 60) {
    advices.unshift("本周建议先降难度到“基础/中等”，先把正确率稳定到70%以上，再冲刺高难题。");
  }

  return {
    bars,
    weakTopics,
    advices,
  };
}

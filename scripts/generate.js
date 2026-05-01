(function () {
  function parseSelection() {
    const raw = localStorage.getItem("alevel.selection");
    return raw ? JSON.parse(raw) : null;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setRunMode(text, isBad) {
    const runMode = byId("runMode");
    if (!runMode) return;
    runMode.textContent = text;
    runMode.className = isBad ? "tip bad" : "tip good";
  }

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function parseTopics(raw) {
    return String(raw || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function collectAnswers(total) {
    const answers = [];
    for (let idx = 0; idx < total; idx += 1) {
      const selected = document.querySelector(`input[name="q_${idx}"]:checked`);
      answers.push(selected ? Number(selected.value) : -1);
    }
    return answers;
  }

  function buildSubmitPayload(answers, hintUsageMap) {
    return answers.map((selectedIndex, idx) => ({
      selectedIndex: Number.isInteger(selectedIndex) ? selectedIndex : -1,
      hintsUsed: Number(hintUsageMap?.[idx]?.used || 0),
    }));
  }

  function applyFeedback(details) {
    details.forEach((row, idx) => {
      const feedback = byId(`feedback_${idx}`);
      if (!feedback) return;

      if (row.selectedIndex === -1) {
        feedback.innerHTML = `<span class='bad'>未作答，正确答案：${String.fromCharCode(65 + row.answer)}</span>`;
        return;
      }

      if (row.correct) {
        feedback.innerHTML = "<span class='good'>回答正确</span>";
      } else {
        feedback.innerHTML = `<span class='bad'>回答错误，正确答案：${String.fromCharCode(65 + row.answer)}</span>`;
      }
    });
  }

  function initHintState(questions) {
    const map = {};
    (questions || []).forEach((q, idx) => {
      map[idx] = {
        used: 0,
        total: Array.isArray(q.hints) ? q.hints.length : 0,
      };
    });
    return map;
  }

  function buildWrongLog(details) {
    const logs = {};
    details.forEach((d) => {
      if (!logs[d.topic]) {
        logs[d.topic] = { topic: d.topic, mistake: d.mistakeType, correct: 0, wrong: 0 };
      }
      if (d.correct) logs[d.topic].correct += 1;
      else logs[d.topic].wrong += 1;
    });
    return Object.values(logs);
  }

  function evaluateLocal(questions, answers, hintUsageMap) {
    let correct = 0;
    const details = [];

    for (let idx = 0; idx < questions.length; idx += 1) {
      const q = questions[idx];
      const selectedIndex = answers[idx] ?? -1;
      const ok = selectedIndex === q.answer;
      if (ok) correct += 1;

      details.push({
        id: q.id,
        topic: q.topic,
        skills: Array.isArray(q.skills) ? q.skills : [],
        mistakeType: q.mistakeType || "concept",
        correct: ok,
        selectedIndex,
        answer: q.answer,
        hintsUsed: Number(hintUsageMap?.[idx]?.used || 0),
        hintTotal: Array.isArray(q.hints) ? q.hints.length : 0,
      });
    }

    const hintRows = Object.values(hintUsageMap || {});
    const hintUsedQuestions = hintRows.filter((x) => x.used > 0).length;
    const totalHintClicks = hintRows.reduce((sum, x) => sum + (x.used || 0), 0);

    return {
      total: questions.length,
      correct,
      wrong: questions.length - correct,
      accuracy: questions.length ? (correct / questions.length) * 100 : 0,
      hintUsedQuestions,
      totalHintClicks,
      details,
      submittedAt: new Date().toISOString(),
    };
  }

  function buildDifficultyTargets(total, preferredDifficulty) {
    const defaultRatio = { "基础": 0.4, "中等": 0.4, "冲刺": 0.2 };
    if (preferredDifficulty && defaultRatio[preferredDifficulty] != null) {
      return { "基础": 0, "中等": 0, "冲刺": 0, [preferredDifficulty]: total };
    }

    const keys = Object.keys(defaultRatio);
    const targets = { "基础": 0, "中等": 0, "冲刺": 0 };
    let used = 0;
    const rows = keys.map((key) => {
      const exact = defaultRatio[key] * total;
      const floor = Math.floor(exact);
      targets[key] = floor;
      used += floor;
      return { key, rem: exact - floor };
    });
    rows.sort((a, b) => b.rem - a.rem);
    for (let i = used; i < total; i += 1) {
      targets[rows[(i - used) % rows.length].key] += 1;
    }
    return targets;
  }

  function pickLocalPaper(selection, options) {
    let pool = window.QUESTION_BANK.filter(
      (q) =>
        q.board === selection.board &&
        q.subject === selection.subject &&
        q.paper === selection.paper
    );

    if (options.difficulty || options.topics.length) {
      const refined = pool.filter((q) => {
        const matchDiff = options.difficulty ? q.difficulty === options.difficulty : false;
        const matchTopic = options.topics.length ? options.topics.includes(q.topic) : false;
        return matchDiff || matchTopic;
      });
      if (refined.length) {
        pool = refined;
      }
    }

    if (pool.length === 0) {
      pool = window.QUESTION_BANK.filter(
        (q) => q.board === selection.board && q.subject === selection.subject
      );
    }

    const shuffled = shuffle(pool);
    const targets = buildDifficultyTargets(options.count, options.difficulty);
    const usedTemplateIds = new Set();
    const selected = [];

    Object.entries(targets).forEach(([difficulty, limit]) => {
      if (!limit) return;
      const bucket = shuffled.filter((q) => q.difficulty === difficulty);
      bucket.forEach((q) => {
        if (selected.length >= options.count || selected.filter((x) => x.difficulty === difficulty).length >= limit) {
          return;
        }
        const templateId = q.templateId || q.id;
        if (!usedTemplateIds.has(templateId)) {
          selected.push(q);
          usedTemplateIds.add(templateId);
        }
      });
    });

    shuffled.forEach((q) => {
      if (selected.length >= options.count) return;
      const templateId = q.templateId || q.id;
      if (!usedTemplateIds.has(templateId)) {
        selected.push(q);
        usedTemplateIds.add(templateId);
      }
    });

    if (selected.length < options.count) {
      shuffled.forEach((q) => {
        if (selected.length >= options.count) return;
        if (!selected.includes(q)) selected.push(q);
      });
    }

    return selected.slice(0, options.count);
  }

  function persistResult(result, wrongLog) {
    localStorage.setItem("alevel.lastResult", JSON.stringify(result));
    localStorage.setItem("alevel.wrongLog", JSON.stringify(wrongLog));
  }

  function renderScore(result) {
    const box = byId("scoreBox");
    const level = result.accuracy >= 80 ? "good" : "bad";
    box.innerHTML = `
      <h3>本次成绩</h3>
      <p>得分：<strong>${result.correct}/${result.total}</strong></p>
      <p>正确率：<strong class='${level}'>${result.accuracy.toFixed(1)}%</strong></p>
      <p>提示使用：<strong>${result.hintUsedQuestions || 0}</strong>题，累计<strong>${result.totalHintClicks || 0}</strong>次</p>
      <p class='tip'>提交时间：${new Date(result.submittedAt).toLocaleString()}</p>
    `;
  }

  function renderPaper(picked) {
    const wrap = byId("paperResult");
    wrap.innerHTML = "";

    if (!picked.length) {
      wrap.innerHTML = "<p class='bad'>当前筛选条件下暂无题目，请放宽难度或知识点条件。</p>";
      return;
    }

    const hint = document.createElement("p");
    hint.className = "tip";
    hint.textContent = "可先作答再判分；若卡住可按题目下方“显示提示”逐步获取线索。";
    wrap.appendChild(hint);

    picked.forEach((q, idx) => {
      const box = document.createElement("div");
      box.className = "question";

      const optionsHtml = (q.options || [])
        .map(
          (opt, optIdx) => `
        <label class="option-item">
          <input type="radio" name="q_${idx}" value="${optIdx}" />
          <span>${String.fromCharCode(65 + optIdx)}. ${opt}</span>
        </label>
      `
        )
        .join("");

      box.innerHTML = `
        <h4>Q${idx + 1}. ${q.stem}</h4>
        <div class="tag-row">
          <span class="tag">${q.id}</span>
          <span class="tag">${q.topic}</span>
          <span class="tag">${q.difficulty}</span>
        </div>
        <div class="options-wrap">${optionsHtml}</div>
        <div class="actions">
          <button class='btn-secondary' id='hintBtn_${idx}'>显示提示</button>
        </div>
        <div id="hint_${idx}" class="tip"></div>
        <div id="feedback_${idx}" class="tip"></div>
      `;
      wrap.appendChild(box);
    });

    const action = document.createElement("div");
    action.className = "actions";
    action.innerHTML = `
      <button class='btn-primary' id='submitPaper'>提交并判分</button>
      <button class='btn-secondary' id='toAnalysis'>进入错题分析页</button>
    `;
    wrap.appendChild(action);

    const scoreBox = document.createElement("div");
    scoreBox.id = "scoreBox";
    scoreBox.className = "panel";
    scoreBox.style.marginTop = "0.8rem";
    scoreBox.innerHTML = "<p class='tip'>尚未提交</p>";
    wrap.appendChild(scoreBox);
  }

  const selection = parseSelection();
  const state = {
    mode: "backend",
    paperId: null,
    questions: [],
    hintUsageMap: {},
  };

  const summaryEl = byId("selectionSummary");
  if (!selection) {
    summaryEl.textContent = "未读取到首页配置，请返回首页重新选择。";
    setRunMode("请先返回首页选择学习路径。", true);
  } else {
    summaryEl.textContent = `当前路径：${selection.grade} / ${selection.board} / ${selection.subject} / ${selection.paper}`;
    setRunMode("准备就绪：将优先使用后端 API 组卷与判分。", false);
  }

  byId("backBtn").addEventListener("click", () => {
    location.href = "../index.html";
  });

  byId("generateBtn").addEventListener("click", async () => {
    if (!selection) return;

    const generateBtn = byId("generateBtn");
    const originalText = generateBtn.textContent;
    generateBtn.disabled = true;
    generateBtn.textContent = "生成中...";

    const options = {
      count: Number(byId("count").value || 8),
      difficulty: byId("difficulty").value,
      topics: parseTopics(byId("topics").value),
    };
    const userId = localStorage.getItem("alevel.userId") || null;

    try {
      if (!window.ALevelApi) {
        throw new Error("API client not loaded");
      }

      const data = await window.ALevelApi.generatePaper({
        userId,
        selection,
        options,
      });

      state.mode = "backend";
      state.paperId = data.paperId;
      state.questions = data.questions || [];
      state.hintUsageMap = initHintState(state.questions);
      localStorage.setItem("alevel.generatedPaper", JSON.stringify(state.questions));
      renderPaper(state.questions);

      const fallbackHint = data.fallbackApplied
        ? "（已自动放宽筛选）"
        : "";
      setRunMode(`后端组卷成功 ${fallbackHint}`, false);
    } catch (_err) {
      state.mode = "local";
      state.paperId = null;
      state.questions = pickLocalPaper(selection, options);
      state.hintUsageMap = initHintState(state.questions);
      localStorage.setItem("alevel.generatedPaper", JSON.stringify(state.questions));
      renderPaper(state.questions);
      setRunMode("后端组卷失败，已回退到本地示例题库。", true);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = originalText;
      bindPaperActions();
    }
  });

  function bindPaperActions() {
    const submitBtn = byId("submitPaper");
    const toAnalysis = byId("toAnalysis");
    if (!submitBtn || !toAnalysis) return;

    state.questions.forEach((q, idx) => {
      const hintBtn = byId(`hintBtn_${idx}`);
      const hintEl = byId(`hint_${idx}`);
      if (!hintBtn || !hintEl) return;
      hintBtn.onclick = () => {
        const hints = Array.isArray(q.hints) ? q.hints : [];
        if (!hints.length) {
          hintEl.textContent = "该题暂无提示，请先尝试拆分题干条件。";
          return;
        }
        const row = state.hintUsageMap[idx];
        const nextIndex = Math.min(row.used, hints.length - 1);
        hintEl.textContent = `提示 ${nextIndex + 1}/${hints.length}: ${hints[nextIndex]}`;
        row.used += 1;
        hintBtn.textContent = row.used >= hints.length ? "提示已全部显示" : "显示下一条提示";
      };
    });

    submitBtn.onclick = async () => {
      if (!state.questions.length) return;

      const answers = collectAnswers(state.questions.length);

      try {
        if (state.mode === "backend" && state.paperId && window.ALevelApi) {
          const data = await window.ALevelApi.submitPaper({
            paperId: state.paperId,
            answers: buildSubmitPayload(answers, state.hintUsageMap),
          });
          const result = data.result;
          const wrongLog = data.wrongLog || buildWrongLog(result.details || []);
          result.hintUsedQuestions = Object.values(state.hintUsageMap).filter((x) => x.used > 0).length;
          result.totalHintClicks = Object.values(state.hintUsageMap).reduce((sum, x) => sum + (x.used || 0), 0);
          applyFeedback(result.details || []);
          persistResult(result, wrongLog);
          renderScore(result);
          setRunMode("提交成功：后端已完成判分与分析。", false);
          return;
        }

        throw new Error("backend mode unavailable");
      } catch (_err) {
        const result = evaluateLocal(state.questions, answers, state.hintUsageMap);
        const wrongLog = buildWrongLog(result.details || []);
        applyFeedback(result.details || []);
        persistResult(result, wrongLog);
        renderScore(result);
        setRunMode("后端提交失败，已使用本地判分结果。", true);
      }
    };

    toAnalysis.onclick = () => {
      location.href = "analysis.html";
    };
  }
})();

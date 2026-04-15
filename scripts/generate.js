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

  function evaluateLocal(questions, answers) {
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
        mistakeType: q.mistakeType || "concept",
        correct: ok,
        selectedIndex,
        answer: q.answer,
      });
    }

    return {
      total: questions.length,
      correct,
      wrong: questions.length - correct,
      accuracy: questions.length ? (correct / questions.length) * 100 : 0,
      details,
      submittedAt: new Date().toISOString(),
    };
  }

  function pickLocalPaper(selection, options) {
    let pool = window.QUESTION_BANK.filter(
      (q) =>
        q.board === selection.board &&
        q.subject === selection.subject &&
        q.paper === selection.paper
    );

    pool = pool.filter(
      (q) => q.difficulty === options.difficulty || options.topics.includes(q.topic)
    );

    if (pool.length === 0) {
      pool = window.QUESTION_BANK.filter(
        (q) => q.board === selection.board && q.subject === selection.subject
      );
    }

    return shuffle(pool).slice(0, options.count);
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
    hint.textContent = "请选择每道题答案后点击“提交并判分”。";
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

    submitBtn.onclick = async () => {
      if (!state.questions.length) return;

      const answers = collectAnswers(state.questions.length);

      try {
        if (state.mode === "backend" && state.paperId && window.ALevelApi) {
          const data = await window.ALevelApi.submitPaper({
            paperId: state.paperId,
            answers,
          });
          const result = data.result;
          const wrongLog = data.wrongLog || buildWrongLog(result.details || []);
          applyFeedback(result.details || []);
          persistResult(result, wrongLog);
          renderScore(result);
          setRunMode("提交成功：后端已完成判分与分析。", false);
          return;
        }

        throw new Error("backend mode unavailable");
      } catch (_err) {
        const result = evaluateLocal(state.questions, answers);
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

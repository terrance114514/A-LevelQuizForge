(function () {
  function parseSelection() {
    const raw = localStorage.getItem("alevel.selection");
    return raw ? JSON.parse(raw) : null;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  const selection = parseSelection();
  const summaryEl = byId("selectionSummary");

  if (!selection) {
    summaryEl.textContent = "未读取到首页配置，请返回首页重新选择。";
  } else {
    summaryEl.textContent = `当前路径：${selection.grade} / ${selection.board} / ${selection.subject} / ${selection.paper}`;
  }

  byId("backBtn").addEventListener("click", () => {
    location.href = "../index.html";
  });

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

      const optionsHtml = (q.options || []).map((opt, optIdx) => `
        <label class="option-item">
          <input type="radio" name="q_${idx}" value="${optIdx}" />
          <span>${String.fromCharCode(65 + optIdx)}. ${opt}</span>
        </label>
      `).join("");

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

    document.getElementById("submitPaper").addEventListener("click", () => {
      const result = evaluatePaper(picked);
      if (!result) return;
      persistResult(result);
      renderScore(result);
    });

    document.getElementById("toAnalysis").addEventListener("click", () => {
      location.href = "analysis.html";
    });
  }

  function evaluatePaper(picked) {
    let correct = 0;
    const details = [];

    for (let idx = 0; idx < picked.length; idx += 1) {
      const q = picked[idx];
      const selected = document.querySelector(`input[name=\"q_${idx}\"]:checked`);
      const selectedIndex = selected ? Number(selected.value) : -1;
      const ok = selectedIndex === q.answer;
      if (ok) correct += 1;

      const feedback = document.getElementById(`feedback_${idx}`);
      if (feedback) {
        if (selectedIndex === -1) {
          feedback.innerHTML = `<span class='bad'>未作答，正确答案：${String.fromCharCode(65 + q.answer)}</span>`;
        } else if (ok) {
          feedback.innerHTML = "<span class='good'>回答正确</span>";
        } else {
          feedback.innerHTML = `<span class='bad'>回答错误，正确答案：${String.fromCharCode(65 + q.answer)}</span>`;
        }
      }

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
      total: picked.length,
      correct,
      wrong: picked.length - correct,
      accuracy: picked.length ? (correct / picked.length) * 100 : 0,
      details,
      submittedAt: new Date().toISOString(),
    };
  }

  function persistResult(result) {
    localStorage.setItem("alevel.lastResult", JSON.stringify(result));

    const logs = {};
    result.details.forEach((d) => {
      if (!logs[d.topic]) {
        logs[d.topic] = { topic: d.topic, mistake: d.mistakeType, correct: 0, wrong: 0 };
      }
      if (d.correct) logs[d.topic].correct += 1;
      else logs[d.topic].wrong += 1;
    });

    localStorage.setItem("alevel.wrongLog", JSON.stringify(Object.values(logs)));
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

  byId("generateBtn").addEventListener("click", () => {
    if (!selection) return;

    const count = Number(byId("count").value || 8);
    const difficulty = byId("difficulty").value;
    const topics = String(byId("topics").value)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    let pool = window.QUESTION_BANK.filter(
      (q) =>
        q.board === selection.board &&
        q.subject === selection.subject &&
        q.paper === selection.paper
    );

    pool = pool.filter((q) => q.difficulty === difficulty || topics.includes(q.topic));

    if (pool.length === 0) {
      pool = window.QUESTION_BANK.filter(
        (q) => q.board === selection.board && q.subject === selection.subject
      );
    }

    const picked = shuffle(pool).slice(0, count);
    localStorage.setItem("alevel.generatedPaper", JSON.stringify(picked));
    renderPaper(picked);
  });
})();

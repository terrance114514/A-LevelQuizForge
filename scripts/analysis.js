(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  const raw = localStorage.getItem("alevel.selection");
  const selection = raw ? JSON.parse(raw) : null;
  byId("selectionSummary").textContent = selection
    ? `当前路径：${selection.grade} / ${selection.board} / ${selection.subject} / ${selection.paper}`
    : "未读取到路径配置（可返回首页重新选择）";

  const bars = byId("bars");
  const advice = byId("advice");

  const localLogRaw = localStorage.getItem("alevel.wrongLog");
  const logs = localLogRaw ? JSON.parse(localLogRaw) : window.SAMPLE_WRONG_LOG;

  const lastResultRaw = localStorage.getItem("alevel.lastResult");
  const lastResult = lastResultRaw ? JSON.parse(lastResultRaw) : null;

  if (lastResult) {
    const brief = document.createElement("p");
    brief.className = "tip";
    brief.innerHTML = `最近一次练习：${lastResult.correct}/${lastResult.total}，正确率 ${lastResult.accuracy.toFixed(1)}%`;
    byId("selectionSummary").after(brief);
  }

  bars.innerHTML = "";

  logs.forEach((row) => {
    const total = row.correct + row.wrong;
    const wrongRate = total ? (row.wrong / total) * 100 : 0;

    const block = document.createElement("div");
    block.innerHTML = `
      <div>${row.topic}（错因：${row.mistake}）</div>
      <div class="bar">
        <span style="width:${wrongRate.toFixed(1)}%"></span>
        <em>${wrongRate.toFixed(1)}%</em>
      </div>
    `;
    bars.appendChild(block);
  });

  const sorted = [...logs].sort((a, b) => (b.wrong / (b.correct + b.wrong)) - (a.wrong / (a.correct + a.wrong)));
  const top2 = sorted.slice(0, 2);

  const weakTopics = top2.map((x) => x.topic).join("、") || "基础模块";
  const advices = [
    `7天短期：优先复习 ${weakTopics}，每天20分钟概念回顾 + 4道定向训练。`,
    "30天长期：每周一次限时小测，建立错因标签（概念/计算/审题）并复盘。",
    "策略建议：先做基础题保证正确率，再逐步增加冲刺题比例至40%。",
  ];

  if (lastResult && lastResult.accuracy < 60) {
    advices.unshift("本周建议先降难度到“基础/中等”，先把正确率稳定到70%以上，再冲刺高难题。");
  }

  advice.innerHTML = "";
  advices.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    advice.appendChild(li);
  });

  byId("backHome").addEventListener("click", () => {
    location.href = "../index.html";
  });
})();

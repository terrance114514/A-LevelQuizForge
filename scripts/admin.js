(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function safeText(value) {
    if (value == null) return "-";
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function fmtDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function setStatus(text, isBad) {
    const statusEl = byId("adminStatus");
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = isBad ? "tip bad" : "tip good";
  }

  function renderSummary(summary) {
    const wrap = byId("summaryCards");
    if (!wrap) return;

    const cards = [
      { label: "用户总数", value: summary?.usersCount ?? 0 },
      { label: "练习总数", value: summary?.practiceCount ?? 0 },
      { label: "已提交练习", value: summary?.submittedCount ?? 0 },
    ];

    wrap.innerHTML = cards
      .map(
        (item) => `
      <article class="stat-card">
        <div class="stat-label">${safeText(item.label)}</div>
        <div class="stat-value">${safeText(item.value)}</div>
      </article>
    `
      )
      .join("");
  }

  function renderUsers(users) {
    const body = byId("usersBody");
    if (!body) return;

    if (!users?.length) {
      body.innerHTML = "<tr><td colspan='7' class='tip'>暂无用户数据</td></tr>";
      return;
    }

    body.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td class="mono">${safeText(u.id)}</td>
        <td>${safeText(u.displayName)}</td>
        <td>${safeText(u.email || "-")}</td>
        <td>${safeText(u.role)}</td>
        <td>${safeText(u.grade || "-")}</td>
        <td>${safeText(u.targetScore ?? "-")}</td>
        <td>${safeText(fmtDate(u.createdAt))}</td>
      </tr>
    `
      )
      .join("");
  }

  function renderPractices(practices) {
    const body = byId("practicesBody");
    if (!body) return;

    if (!practices?.length) {
      body.innerHTML = "<tr><td colspan='7' class='tip'>暂无练习记录</td></tr>";
      return;
    }

    body.innerHTML = practices
      .map((p) => {
        const path = `${p.board || "-"} / ${p.subject || "-"} / ${p.paper || "-"}`;
        const userLabel = p.userDisplayName || p.userEmail || p.userId || "-";
        const accuracy =
          p.accuracy == null || Number.isNaN(Number(p.accuracy))
            ? "-"
            : `${Number(p.accuracy).toFixed(1)}%`;

        return `
        <tr>
          <td class="mono">${safeText(p.id)}</td>
          <td>${safeText(userLabel)}</td>
          <td>${safeText(path)}</td>
          <td>${safeText(p.status || "-")}</td>
          <td>${safeText(accuracy)}</td>
          <td>${safeText(fmtDate(p.createdAt))}</td>
          <td>${safeText(fmtDate(p.submittedAt))}</td>
        </tr>
      `;
      })
      .join("");
  }

  async function loadRecords() {
    const refreshBtn = byId("refreshBtn");
    const oldText = refreshBtn.textContent;
    refreshBtn.disabled = true;
    refreshBtn.textContent = "刷新中...";

    const usersLimit = Number(byId("usersLimit").value || 10);
    const practicesLimit = Number(byId("practicesLimit").value || 20);

    try {
      if (!window.ALevelApi) {
        throw new Error("API client not loaded");
      }

      const data = await window.ALevelApi.getAdminRecords({
        usersLimit,
        practicesLimit,
      });

      renderSummary(data.summary || {});
      renderUsers(data.latestUsers || []);
      renderPractices(data.latestPractices || []);
      setStatus("数据加载成功（来源：后端数据库）。", false);
    } catch (err) {
      renderSummary({ usersCount: 0, practiceCount: 0, submittedCount: 0 });
      renderUsers([]);
      renderPractices([]);
      setStatus(`加载失败：${err.message || "请检查后端服务与数据库配置。"}`, true);
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = oldText;
    }
  }

  byId("refreshBtn").addEventListener("click", () => {
    loadRecords();
  });

  byId("backHome").addEventListener("click", () => {
    location.href = "../index.html";
  });

  loadRecords();
})();

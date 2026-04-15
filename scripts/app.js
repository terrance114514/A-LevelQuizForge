(function () {
  const USER_PROFILE_KEY = "alevel.userProfile";
  const USER_ID_KEY = "alevel.userId";
  const AUTH_TOKEN_KEY = "alevel.authToken";

  function getEl(id) {
    return document.getElementById(id);
  }

  function fillSelect(select, items) {
    select.innerHTML = "";
    items.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      select.appendChild(opt);
    });
  }

  function setBackendStatus(text, isBad) {
    const statusEl = getEl("backendStatus");
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = isBad ? "tip bad" : "tip good";
  }

  function setAccountStatus(text, isBad) {
    const statusEl = getEl("accountStatus");
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = isBad ? "tip bad" : "tip good";
  }

  function readAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  }

  async function loadCurriculumData() {
    if (!window.ALevelApi) {
      setBackendStatus("未检测到 API 客户端，当前使用本地示例数据。", true);
      return window.CURRICULUM_DATA;
    }

    try {
      const [curriculum, storage] = await Promise.all([
        window.ALevelApi.getCurriculum(),
        window.ALevelApi.getStorageMode().catch(() => null),
      ]);
      const modeText = storage?.mode ? `（存储模式：${storage.mode}）` : "";
      setBackendStatus(`后端连接成功，课程配置来自 API ${modeText}`, false);
      return curriculum;
    } catch (_err) {
      setBackendStatus("后端连接失败，当前回退到本地示例数据。", true);
      return window.CURRICULUM_DATA;
    }
  }

  async function buildHome() {
    const token = readAuthToken();
    if (!token || !window.ALevelApi?.getCurrentUser) {
      location.href = "pages/login.html";
      return;
    }
    let currentUser = null;
    try {
      currentUser = await window.ALevelApi.getCurrentUser(token);
    } catch (_err) {
      localStorage.removeItem(USER_PROFILE_KEY);
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      location.href = "pages/login.html";
      return;
    }

    const gradeEl = getEl("grade");
    if (!gradeEl) return;

    const boardEl = getEl("board");
    const subjectEl = getEl("subject");
    const paperEl = getEl("paper");

    const data = await loadCurriculumData();
    const boards = data?.boards || {};
    const boardKeys = Object.keys(boards);
    if (!boardKeys.length) {
      setBackendStatus("课程配置为空，请检查后端 /api/meta/curriculum。", true);
      return;
    }

    fillSelect(gradeEl, data?.grades || ["AS"]);
    fillSelect(boardEl, boardKeys);

    function refreshSubjects() {
      const board = boardEl.value;
      const subjects = Object.keys(boards[board] || {});
      fillSelect(subjectEl, subjects);
      refreshPapers();
    }

    function refreshPapers() {
      const board = boardEl.value;
      const subject = subjectEl.value;
      const papers = boards?.[board]?.[subject] || [];
      fillSelect(paperEl, papers);
    }

    boardEl.addEventListener("change", refreshSubjects);
    subjectEl.addEventListener("change", refreshPapers);

    refreshSubjects();

    const packSelection = () => {
      const payload = {
        grade: gradeEl.value,
        board: boardEl.value,
        subject: subjectEl.value,
        paper: paperEl.value,
      };
      localStorage.setItem("alevel.selection", JSON.stringify(payload));
      return payload;
    };

    getEl("goGenerate").addEventListener("click", () => {
      packSelection();
      location.href = "pages/generate.html";
    });

    getEl("goAnalysis").addEventListener("click", () => {
      packSelection();
      location.href = "pages/analysis.html";
    });

    const goAdmin = getEl("goAdmin");
    if (goAdmin) {
      goAdmin.addEventListener("click", () => {
        location.href = "pages/admin.html";
      });
    }

    const goLogin = getEl("goLogin");
    if (goLogin) {
      goLogin.addEventListener("click", () => {
        location.href = "pages/login.html";
      });
    }

    function fillAccountForm(user) {
      getEl("newDisplayName").value = user?.displayName || "";
      getEl("newGrade").value = user?.grade || "";
      getEl("newTargetScore").value =
        user?.targetScore == null ? "" : String(user.targetScore);
      getEl("oldPassword").value = "";
      getEl("newPassword").value = "";
    }

    fillAccountForm(currentUser);
    setAccountStatus(`当前登录：${currentUser?.displayName || "未知用户"}`, false);

    const updateProfileBtn = getEl("updateProfileBtn");
    if (updateProfileBtn) {
      updateProfileBtn.addEventListener("click", async () => {
        const displayName = getEl("newDisplayName").value.trim();
        const grade = getEl("newGrade").value.trim();
        const targetScoreRaw = getEl("newTargetScore").value.trim();
        const targetScore = targetScoreRaw === "" ? null : Number.parseInt(targetScoreRaw, 10);
        if (!displayName) {
          setAccountStatus("昵称不能为空。", true);
          return;
        }

        updateProfileBtn.disabled = true;
        const oldText = updateProfileBtn.textContent;
        updateProfileBtn.textContent = "保存中...";
        try {
          const user = await window.ALevelApi.updateCurrentUser(token, {
            displayName,
            grade: grade || null,
            targetScore: Number.isNaN(targetScore) ? null : targetScore,
          });
          localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
          fillAccountForm(user);
          setAccountStatus("资料修改成功。", false);
        } catch (err) {
          setAccountStatus(`资料修改失败：${err.message || "请稍后重试"}`, true);
        } finally {
          updateProfileBtn.disabled = false;
          updateProfileBtn.textContent = oldText;
        }
      });
    }

    const changePasswordBtn = getEl("changePasswordBtn");
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener("click", async () => {
        const oldPassword = getEl("oldPassword").value.trim();
        const newPassword = getEl("newPassword").value.trim();
        if (!oldPassword || !newPassword) {
          setAccountStatus("请填写旧密码和新密码。", true);
          return;
        }
        if (newPassword.length < 6) {
          setAccountStatus("新密码至少 6 位。", true);
          return;
        }

        changePasswordBtn.disabled = true;
        const oldText = changePasswordBtn.textContent;
        changePasswordBtn.textContent = "修改中...";
        try {
          await window.ALevelApi.changePassword(token, { oldPassword, newPassword });
          getEl("oldPassword").value = "";
          getEl("newPassword").value = "";
          setAccountStatus("密码修改成功。", false);
        } catch (err) {
          setAccountStatus(`密码修改失败：${err.message || "请稍后重试"}`, true);
        } finally {
          changePasswordBtn.disabled = false;
          changePasswordBtn.textContent = oldText;
        }
      });
    }

  }

  window.ALevelApp = { fillSelect };
  buildHome().catch(() => {
    setBackendStatus("初始化失败，请刷新页面后重试。", true);
  });
})();

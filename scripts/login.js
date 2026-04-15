(function () {
  const USER_PROFILE_KEY = "alevel.userProfile";
  const USER_ID_KEY = "alevel.userId";
  const AUTH_TOKEN_KEY = "alevel.authToken";

  function byId(id) {
    return document.getElementById(id);
  }

  function setAuthStatus(text, isBad) {
    const statusEl = byId("authStatus");
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = isBad ? "tip bad" : "tip good";
  }

  function readUserProfile() {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  }

  function writeUserProfile(profile) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    if (profile?.id) {
      localStorage.setItem(USER_ID_KEY, profile.id);
    }
  }

  function readAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  }

  function writeAuthToken(token) {
    if (!token) return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  function clearAuth() {
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  function fillForm(user) {
    byId("userDisplayName").value = user?.displayName || "";
    byId("userEmail").value = user?.email || "";
    byId("userGrade").value = user?.grade || "";
    byId("userTargetScore").value = user?.targetScore == null ? "" : String(user.targetScore);
    byId("userPassword").value = "";
  }

  function applyAuthSuccess(payload, text) {
    writeUserProfile(payload.user);
    writeAuthToken(payload.token);
    fillForm(payload.user);
    setAuthStatus(text, false);
    setTimeout(() => {
      location.href = "../index.html";
    }, 300);
  }

  async function init() {
    const registerBtn = byId("registerBtn");
    const loginBtn = byId("loginBtn");
    const logoutBtn = byId("logoutBtn");
    const goHomeBtn = byId("goHomeBtn");

    const existing = readUserProfile();
    if (existing?.displayName && readAuthToken()) {
      fillForm(existing);
      setAuthStatus(`已登录：${existing.displayName}（长期保存）`, false);
    } else {
      setAuthStatus("当前未登录，请先注册或登录。", true);
    }

    registerBtn.addEventListener("click", async () => {
      const displayName = byId("userDisplayName").value.trim();
      const email = byId("userEmail").value.trim();
      const password = byId("userPassword").value.trim();
      const grade = byId("userGrade").value.trim();
      const targetScoreRaw = byId("userTargetScore").value.trim();
      const targetScore = targetScoreRaw === "" ? null : Number.parseInt(targetScoreRaw, 10);

      if (!displayName || !email || !password) {
        setAuthStatus("注册需要填写姓名、邮箱、密码。", true);
        return;
      }
      if (password.length < 6) {
        setAuthStatus("密码至少 6 位。", true);
        return;
      }

      registerBtn.disabled = true;
      const old = registerBtn.textContent;
      registerBtn.textContent = "注册中...";
      try {
        const data = await window.ALevelApi.register({
          displayName,
          email,
          password,
          grade: grade || null,
          targetScore: Number.isNaN(targetScore) ? null : targetScore,
        });
        applyAuthSuccess(data, `注册成功：${data.user.displayName}`);
      } catch (err) {
        setAuthStatus(`注册失败：${err.message || "请稍后重试"}`, true);
      } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = old;
      }
    });

    loginBtn.addEventListener("click", async () => {
      const email = byId("userEmail").value.trim();
      const password = byId("userPassword").value.trim();
      if (!email || !password) {
        setAuthStatus("登录需要邮箱和密码。", true);
        return;
      }

      loginBtn.disabled = true;
      const old = loginBtn.textContent;
      loginBtn.textContent = "登录中...";
      try {
        const data = await window.ALevelApi.login({ email, password });
        applyAuthSuccess(data, `登录成功：${data.user.displayName}`);
      } catch (err) {
        setAuthStatus(`登录失败：${err.message || "账号或密码错误"}`, true);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = old;
      }
    });

    logoutBtn.addEventListener("click", () => {
      clearAuth();
      fillForm(null);
      setAuthStatus("已退出登录。", false);
    });

    goHomeBtn.addEventListener("click", () => {
      location.href = "../index.html";
    });

    const token = readAuthToken();
    if (token) {
      window.ALevelApi.getCurrentUser(token)
        .then((user) => {
          writeUserProfile(user);
          fillForm(user);
          setAuthStatus(`已自动登录：${user.displayName}`, false);
          setTimeout(() => {
            location.href = "../index.html";
          }, 300);
        })
        .catch(() => {
          clearAuth();
          setAuthStatus("登录已过期，请重新登录。", true);
        });
    }
  }

  init();
})();

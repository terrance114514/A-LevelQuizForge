(function () {
  const DEFAULT_TIMEOUT_MS = 8000;

  function normalizeBaseUrl(url) {
    return String(url || "").trim().replace(/\/+$/, "");
  }

  function resolveBaseUrl() {
    const saved = localStorage.getItem("alevel.apiBase");
    if (saved && normalizeBaseUrl(saved)) {
      return normalizeBaseUrl(saved);
    }

    if (window.location.protocol.startsWith("http")) {
      // Prefer same-origin API (served by reverse proxy) to avoid cross-port latency.
      return "";
    }

    return "http://localhost:3001";
  }

  let apiBaseUrl = resolveBaseUrl();

  async function request(path, options = {}) {
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const hasBody = options.body != null;
    const headers = {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(`${apiBaseUrl}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body,
        signal: controller.signal,
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          payload?.error?.message || `Request failed with status ${res.status}`;
        const err = new Error(message);
        err.status = res.status;
        err.payload = payload;
        throw err;
      }

      return payload?.data ?? payload;
    } finally {
      clearTimeout(timer);
    }
  }

  window.ALevelApi = {
    getBaseUrl() {
      return apiBaseUrl;
    },
    setBaseUrl(url) {
      const normalized = normalizeBaseUrl(url);
      if (!normalized) return;
      apiBaseUrl = normalized;
      localStorage.setItem("alevel.apiBase", normalized);
    },
    async getCurriculum() {
      return request("/api/meta/curriculum");
    },
    async getStorageMode() {
      return request("/api/meta/storage");
    },
    async generatePaper(input) {
      return request("/api/papers/generate", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    async submitPaper(input) {
      return request("/api/papers/submit", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    async buildAnalysis(input) {
      return request("/api/analysis", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    async getAdminRecords(input = {}) {
      const usersLimit = Number(input.usersLimit || 20);
      const practicesLimit = Number(input.practicesLimit || 20);
      const query = `?usersLimit=${usersLimit}&practicesLimit=${practicesLimit}`;
      return request(`/api/admin/records${query}`);
    },
    async createUser(input) {
      return request("/api/users", {
        method: "POST",
        body: JSON.stringify(input || {}),
      });
    },
    async getUserById(userId) {
      return request(`/api/users/${encodeURIComponent(userId)}`);
    },
    async register(input) {
      return request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input || {}),
      });
    },
    async login(input) {
      return request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input || {}),
      });
    },
    async getCurrentUser(token) {
      return request("/api/auth/me", { token });
    },
    async updateCurrentUser(token, input) {
      return request("/api/auth/me", {
        method: "PATCH",
        token,
        body: JSON.stringify(input || {}),
      });
    },
    async changePassword(token, input) {
      return request("/api/auth/change-password", {
        method: "POST",
        token,
        body: JSON.stringify(input || {}),
      });
    },
  };
})();

export class ApiError extends Error {
  constructor(statusCode, message, code = "BAD_REQUEST", details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // PostgreSQL unique violation
  if (err && err.code === "23505") {
    res.status(409).json({
      ok: false,
      error: {
        code: "CONFLICT",
        message: "Resource already exists.",
        details: err.detail || null,
      },
    });
    return;
  }

  // PostgreSQL foreign key violation
  if (err && err.code === "23503") {
    res.status(400).json({
      ok: false,
      error: {
        code: "INVALID_REFERENCE",
        message: "Referenced resource does not exist.",
        details: err.detail || null,
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error.",
    },
  });
}

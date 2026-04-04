import { ApiError } from "./http.js";

export function requireString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `Field "${fieldName}" is required and must be a non-empty string.`, "INVALID_INPUT");
  }
  return value.trim();
}

export function toStringArray(value) {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  throw new ApiError(400, 'Field "topics" must be a string or array.', "INVALID_INPUT");
}

export function toClampedInteger(value, defaultValue, min, max) {
  const parsed = Number.isFinite(Number(value)) ? Number(value) : defaultValue;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function requireArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new ApiError(400, `Field "${fieldName}" is required and must be an array.`, "INVALID_INPUT");
  }
  return value;
}

import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  return Buffer.from(normalized, "base64").toString("utf8");
}

function hmac(content) {
  return crypto.createHmac("sha256", env.authSecret).update(content).digest();
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `pbkdf2$120000$${salt}$${hash}`;
}

export function verifyPassword(password, packedHash) {
  if (!packedHash || typeof packedHash !== "string") return false;
  const [algo, iterText, salt, hash] = packedHash.split("$");
  if (algo !== "pbkdf2") return false;
  const iterations = Number(iterText);
  if (!Number.isInteger(iterations) || iterations < 10000) return false;
  const calculated = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash));
  } catch (_err) {
    return false;
  }
}

export function issueToken(user) {
  const payload = {
    sub: user.id,
    email: user.email || null,
    role: user.role || "student",
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const payloadText = JSON.stringify(payload);
  const payloadPart = b64url(payloadText);
  const signaturePart = b64url(hmac(payloadPart));
  return `${payloadPart}.${signaturePart}`;
}

export function readAuthToken(req) {
  const auth = req.headers.authorization || "";
  const prefix = "Bearer ";
  if (!auth.startsWith(prefix)) {
    throw new ApiError(401, "Missing bearer token.", "UNAUTHORIZED");
  }
  return auth.slice(prefix.length).trim();
}

export function verifyToken(token) {
  const [payloadPart, signaturePart] = String(token || "").split(".");
  if (!payloadPart || !signaturePart) {
    throw new ApiError(401, "Invalid token format.", "UNAUTHORIZED");
  }

  const expectedSignature = b64url(hmac(payloadPart));
  if (!crypto.timingSafeEqual(Buffer.from(signaturePart), Buffer.from(expectedSignature))) {
    throw new ApiError(401, "Invalid token signature.", "UNAUTHORIZED");
  }

  let payload;
  try {
    payload = JSON.parse(fromB64url(payloadPart));
  } catch (_err) {
    throw new ApiError(401, "Invalid token payload.", "UNAUTHORIZED");
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload?.sub || !payload?.exp || payload.exp < now) {
    throw new ApiError(401, "Token expired or invalid.", "UNAUTHORIZED");
  }
  return payload;
}

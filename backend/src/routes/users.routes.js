import { Router } from "express";
import { ApiError } from "../utils/http.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toClampedInteger, toOptionalInteger, requireString } from "../utils/validate.js";
import { isDbEnabled } from "../db/client.js";
import { createUser, getUserById, listUsers } from "../db/repositories/users.repository.js";
import { listUserPracticeRecords } from "../services/paperStore.service.js";

const router = Router();

function assertUsersApiEnabled() {
  if (!isDbEnabled()) {
    throw new ApiError(
      503,
      "Users API requires PostgreSQL. Set DATABASE_URL and run DB schema first.",
      "DB_DISABLED"
    );
  }
}

router.get("/", asyncHandler(async (req, res) => {
  assertUsersApiEnabled();
  const limit = toClampedInteger(req.query.limit, 20, 1, 100);
  const users = await listUsers(limit);
  res.json({ ok: true, data: users });
}));

router.post("/", asyncHandler(async (req, res) => {
  assertUsersApiEnabled();
  const body = req.body || {};
  const displayName = requireString(body.displayName, "displayName");
  const role = typeof body.role === "string" && body.role.trim()
    ? body.role.trim().toLowerCase()
    : "student";
  if (!["student", "teacher", "parent"].includes(role)) {
    throw new ApiError(400, 'Field "role" must be one of: student, teacher, parent.', "INVALID_INPUT");
  }

  const user = await createUser({
    email: typeof body.email === "string" ? body.email.trim() : null,
    displayName,
    role,
    grade: typeof body.grade === "string" ? body.grade.trim() : null,
    targetScore: toOptionalInteger(body.targetScore, "targetScore", 0, 100),
  });

  res.status(201).json({
    ok: true,
    data: user,
  });
}));

router.get("/:userId", asyncHandler(async (req, res) => {
  assertUsersApiEnabled();
  const userId = requireString(req.params.userId, "userId");
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.", "USER_NOT_FOUND");
  }

  res.json({
    ok: true,
    data: user,
  });
}));

router.get("/:userId/practices", asyncHandler(async (req, res) => {
  assertUsersApiEnabled();
  const userId = requireString(req.params.userId, "userId");
  const limit = toClampedInteger(req.query.limit, 20, 1, 100);
  const practices = await listUserPracticeRecords(userId, limit);

  res.json({
    ok: true,
    data: practices,
  });
}));

export default router;

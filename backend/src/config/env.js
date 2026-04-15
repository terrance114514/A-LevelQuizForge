import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  dbSsl: process.env.DB_SSL === "true",
  dbRequired: process.env.DB_REQUIRED === "true",
  authSecret: process.env.AUTH_SECRET || "change-me-in-production",
};

env.dbEnabled = Boolean(env.databaseUrl);

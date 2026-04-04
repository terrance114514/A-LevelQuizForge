import express from "express";
import cors from "cors";
import morgan from "morgan";

import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./utils/http.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "alevel-smart-practice-backend",
    timestamp: new Date().toISOString(),
  });
});

registerRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${env.port}`);
});

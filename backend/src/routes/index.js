import metaRoutes from "./meta.routes.js";
import papersRoutes from "./papers.routes.js";
import analysisRoutes from "./analysis.routes.js";

export function registerRoutes(app) {
  app.use("/api/meta", metaRoutes);
  app.use("/api/papers", papersRoutes);
  app.use("/api/analysis", analysisRoutes);
}

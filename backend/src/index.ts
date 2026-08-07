import express from "express";
import { env } from "./lib/env";
import { prisma } from "./prisma";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import adminRoutes from "./routes/admin.routes";
import documentsRouter from "./routes/documents.routes";
import commentsRouter from "./routes/comments.routes";
import workflowRouter from "./routes/workflow.routes";
import auditRouter from "./routes/audit.routes";
import approvalRouter from "./routes/approval.routes";
import notificationsRouter from "./routes/notifications.routes";



const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/documents", documentsRouter);
app.use("/api", commentsRouter);
app.use("/api", workflowRouter);
app.use("/api", auditRouter);
app.use("/api", approvalRouter);
app.use("/api/notifications", notificationsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

async function main() {
  await prisma.$connect();
  console.log("Database connection established.");

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

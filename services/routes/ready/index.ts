import { Router } from "express";
import { databasePool } from "../../database/index.js";

export const readyRouter = Router();

readyRouter.get("/", async (_request, response) => {
  try {
    await databasePool.query("SELECT 1");
    response.json({
      status: "ready",
      database: "up",
    });
  } catch (error) {
    console.error("MySQL 健康检查失败", error);
    response.status(503).json({
      status: "not_ready",
      database: "down",
    });
  }
});

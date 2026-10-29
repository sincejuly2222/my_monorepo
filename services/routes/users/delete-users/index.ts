import type { RequestHandler } from "express";
import type { ResultSetHeader } from "mysql2";
import { databasePool } from "../../../database/index.js";

/** 批量删除用户。 */
export const deleteUsers: RequestHandler = async (request, response, next) => {
  const rawIds =
    typeof request.body === "object" && request.body !== null
      ? (request.body as Record<string, unknown>).ids
      : undefined;

  if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > 100) {
    response.status(400).json({ message: "ids 必须包含 1 到 100 个用户编号" });
    return;
  }

  const ids = [...new Set(rawIds.map(Number))];

  if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
    response.status(400).json({ message: "用户编号格式错误" });
    return;
  }

  try {
    const placeholders = ids.map(() => "?").join(", ");
    const [deleteResult] = await databasePool.execute<ResultSetHeader>(
      `DELETE FROM users WHERE id IN (${placeholders})`,
      ids,
    );

    response.json({
      message: "用户删除成功",
      data: { deletedCount: deleteResult.affectedRows },
    });
  } catch (error) {
    next(error);
  }
};

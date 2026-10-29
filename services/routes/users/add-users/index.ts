import type { RequestHandler } from "express";
import type { ResultSetHeader } from "mysql2";
import { databasePool } from "../../../database/index.js";
import { isDuplicateEntry, validateUserInput } from "../validation.js";

/** 新增用户。 */
export const addUsers: RequestHandler = async (request, response, next) => {
  const result = validateUserInput(request.body);

  if (!result.success) {
    response.status(400).json({ message: result.message });
    return;
  }

  const { workno, name, gender, age, workaddress, entrydate } = result.data;

  try {
    const [insertResult] = await databasePool.execute<ResultSetHeader>(
      `INSERT INTO users
        (workno, name, gender, age, workaddress, entrydate)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [workno, name, gender, age, workaddress, entrydate],
    );

    response.status(201).json({
      message: "用户新增成功",
      data: { id: insertResult.insertId },
    });
  } catch (error) {
    if (isDuplicateEntry(error)) {
      response.status(409).json({ message: "工号已存在" });
      return;
    }

    next(error);
  }
};

import type { RequestHandler } from "express";
import type { ResultSetHeader } from "mysql2";
import { databasePool } from "../../../database/index.js";
import { isDuplicateEntry, validateUserInput } from "../validation.js";

/** 编辑指定用户。 */
export const editUser: RequestHandler = async (request, response, next) => {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id < 1) {
    response.status(400).json({ message: "用户编号格式错误" });
    return;
  }

  const result = validateUserInput(request.body);

  if (!result.success) {
    response.status(400).json({ message: result.message });
    return;
  }

  const { workno, name, gender, age, workaddress, entrydate } = result.data;

  try {
    const [updateResult] = await databasePool.execute<ResultSetHeader>(
      `UPDATE users
      SET workno = ?, name = ?, gender = ?, age = ?, workaddress = ?, entrydate = ?
      WHERE id = ?`,
      [workno, name, gender, age, workaddress, entrydate, id],
    );

    if (updateResult.affectedRows === 0) {
      response.status(404).json({ message: "用户不存在" });
      return;
    }

    response.json({ message: "用户编辑成功" });
  } catch (error) {
    if (isDuplicateEntry(error)) {
      response.status(409).json({ message: "工号已存在" });
      return;
    }

    next(error);
  }
};

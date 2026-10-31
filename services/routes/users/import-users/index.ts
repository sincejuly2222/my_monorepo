import type { RequestHandler } from "express";
import multer, { MulterError } from "multer";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { databasePool } from "../../../database/index.js";
import { isDuplicateEntry } from "../validation.js";
import { parseUserWorkbook } from "./excel.js";

interface ExistingWorknoRow extends RowDataPacket {
  workno: string;
}

interface ImportErrorDetail {
  row: number;
  field: string;
  message: string;
}

/** 让只读取顶层 message 的客户端也能看到首个具体校验原因。 */
function formatImportErrorMessage(summary: string, errors: ImportErrorDetail[]): string {
  const firstError = errors[0];
  if (!firstError) {
    return summary;
  }

  const location = firstError.row > 0 ? `第 ${firstError.row} 行` : "文件";
  const remaining = errors.length > 1 ? `，另有 ${errors.length - 1} 处错误` : "";
  return `${summary}：${location}【${firstError.field}】${firstError.message}${remaining}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    callback(null, file.originalname.toLowerCase().endsWith(".xlsx"));
  },
});

/** 处理人员 Excel 文件上传，并将 Multer 错误转换为可读的 400 响应。 */
export const uploadUserImport: RequestHandler = (request, response, next) => {
  upload.single("file")(request, response, (error: unknown) => {
    if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
      response.status(400).json({ message: "文件不能超过 5 MB" });
      return;
    }
    if (error) {
      response.status(400).json({ message: "文件上传失败，请选择 .xlsx 文件" });
      return;
    }
    next();
  });
};

/** 整批校验并导入人员；任一行失败时不写入任何数据。 */
export const importUsers: RequestHandler = async (request, response, next) => {
  if (!request.file) {
    response.status(400).json({ message: "请选择要导入的 .xlsx 文件" });
    return;
  }

  try {
    const parsed = await parseUserWorkbook(request.file.buffer);
    if (!parsed.success) {
      response.status(400).json({
        message: formatImportErrorMessage(
          `导入文件存在 ${parsed.totalErrors} 处错误`,
          parsed.errors,
        ),
        data: { errors: parsed.errors, totalErrors: parsed.totalErrors },
      });
      return;
    }

    const worknos = parsed.users.map((user) => user.workno);
    const placeholders = worknos.map(() => "?").join(", ");
    const [existingRows] = await databasePool.query<ExistingWorknoRow[]>(
      `SELECT workno FROM users WHERE workno IN (${placeholders})`,
      worknos,
    );

    if (existingRows.length > 0) {
      const existingWorknos = new Set(existingRows.map((row) => row.workno));
      const errors = parsed.users
        .filter((user) => existingWorknos.has(user.workno))
        .map((user) => ({
          row: user.row,
          field: "工号",
          message: `工号 ${user.workno} 已存在`,
        }));
      response.status(409).json({
        message: formatImportErrorMessage(`有 ${errors.length} 个工号已存在`, errors),
        data: { errors, totalErrors: errors.length },
      });
      return;
    }

    const connection = await databasePool.getConnection();
    try {
      await connection.beginTransaction();
      const values = parsed.users.flatMap((user) => [
        user.workno,
        user.name,
        user.gender,
        user.age,
        user.workaddress,
        user.entrydate,
      ]);
      const rowPlaceholders = parsed.users.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
      const [insertResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO users
          (workno, name, gender, age, workaddress, entrydate)
        VALUES ${rowPlaceholders}`,
        values,
      );
      await connection.commit();

      response.status(201).json({
        message: `成功导入 ${insertResult.affectedRows} 名人员`,
        data: { importedCount: insertResult.affectedRows },
      });
    } catch (error) {
      await connection.rollback();
      if (isDuplicateEntry(error)) {
        response.status(409).json({ message: "导入过程中发现重复工号，请重新检查文件" });
        return;
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
};

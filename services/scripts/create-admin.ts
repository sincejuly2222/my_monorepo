import "dotenv/config";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { hashPassword } from "../auth/password.js";
import { databasePool } from "../database/index.js";

const usernamePattern = /^[A-Za-z0-9._-]{3,64}$/;

function getRequiredInput(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }

  return value;
}

async function createAdmin(): Promise<void> {
  const unexpectedArguments = process.argv
    .slice(2)
    .filter((argument) => argument !== "--reset-password");

  if (unexpectedArguments.length > 0) {
    throw new Error(`不支持的参数：${unexpectedArguments.join(", ")}`);
  }

  const username = getRequiredInput("ADMIN_USERNAME").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const displayName = getRequiredInput("ADMIN_DISPLAY_NAME");
  const resetPassword = process.argv.includes("--reset-password");

  if (!usernamePattern.test(username)) {
    throw new Error("ADMIN_USERNAME 长度必须为 3–64，且只能包含字母、数字、点、下划线和连字符");
  }

  if (password.length < 12 || password.length > 128) {
    throw new Error("ADMIN_PASSWORD 长度必须为 12–128 个字符");
  }

  if (displayName.length > 100) {
    throw new Error("ADMIN_DISPLAY_NAME 不能超过 100 个字符");
  }

  const [existingRows] = await databasePool.query<Array<{ id: number } & RowDataPacket>>(
    "SELECT id FROM admin_users WHERE username = ? LIMIT 1",
    [username],
  );
  const existingAdmin = existingRows[0];

  if (existingAdmin && !resetPassword) {
    throw new Error(`管理员 ${username} 已存在；如需更新密码，请显式追加 --reset-password`);
  }

  const passwordHash = await hashPassword(password);

  if (existingAdmin) {
    await databasePool.execute(
      "UPDATE admin_users SET password_hash = ?, display_name = ? WHERE id = ?",
      [passwordHash, displayName, existingAdmin.id],
    );
    console.log(`管理员密码已更新：${username}`);
    return;
  }

  const [result] = await databasePool.execute<ResultSetHeader>(
    `INSERT INTO admin_users (username, display_name, password_hash)
    VALUES (?, ?, ?)`,
    [username, displayName, passwordHash],
  );

  console.log(`管理员已创建：${username}（ID：${result.insertId}）`);
}

createAdmin()
  .catch((error: unknown) => {
    console.error("管理员初始化失败", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await databasePool.end();
  });

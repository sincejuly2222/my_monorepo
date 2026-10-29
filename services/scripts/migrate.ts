import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { RowDataPacket } from "mysql2";
import { createConnection } from "mysql2/promise";
import { databaseConfig } from "../database/index.js";

interface MigrationRow extends RowDataPacket {
  name: string;
}

const migrationsDirectory = fileURLToPath(
  new URL("../database/migrations/", import.meta.url),
);

async function migrate(): Promise<void> {
  const connection = await createConnection({
    ...databaseConfig,
    multipleStatements: true,
  });

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [rows] = await connection.query<MigrationRow[]>(
      "SELECT name FROM schema_migrations",
    );
    const appliedMigrations = new Set(rows.map((row) => row.name));
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort();

    let appliedCount = 0;

    for (const fileName of migrationFiles) {
      if (appliedMigrations.has(fileName)) {
        continue;
      }

      const sql = await readFile(`${migrationsDirectory}/${fileName}`, "utf8");

      if (sql.trim() === "") {
        throw new Error(`迁移文件不能为空：${fileName}`);
      }

      await connection.query(sql);
      await connection.execute(
        "INSERT INTO schema_migrations (name) VALUES (?)",
        [fileName],
      );

      appliedCount += 1;
      console.log(`已执行迁移：${fileName}`);
    }

    if (appliedCount === 0) {
      console.log("没有待执行的迁移");
    }
  } finally {
    await connection.end();
  }
}

migrate().catch((error: unknown) => {
  console.error("数据库迁移失败", error);
  process.exitCode = 1;
});

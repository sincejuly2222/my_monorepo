import "dotenv/config";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { databasePool } from "../database/index.js";

interface WorknoRow extends RowDataPacket {
  workno: string;
}

interface TestUser {
  workno: string;
  name: string;
  gender: string;
  age: number;
  workaddress: string;
  entrydate: string;
}

const addresses = ["北京", "上海", "广州", "深圳", "杭州", "成都"];
const testUsers: TestUser[] = Array.from({ length: 120 }, (_, index) => {
  const number = index + 1;
  const month = String((index % 12) + 1).padStart(2, "0");
  const day = String((index % 28) + 1).padStart(2, "0");

  return {
    workno: `PAGE${String(number).padStart(4, "0")}`,
    name: `分页用户${String(number).padStart(3, "0")}`,
    gender: number % 2 === 0 ? "女" : "男",
    age: 20 + (index % 30),
    workaddress: addresses[index % addresses.length]!,
    entrydate: `202${index % 5}-${month}-${day}`,
  };
});

async function seedTable(
  connection: PoolConnection,
  tableName: "users" | "sys_user",
): Promise<number> {
  const [existingRows] = await connection.query<WorknoRow[]>(
    `SELECT workno FROM ${tableName} WHERE workno LIKE 'PAGE%'`,
  );
  const existingWorknos = new Set(existingRows.map((row) => row.workno));
  const pendingUsers = testUsers.filter(
    (user) => !existingWorknos.has(user.workno),
  );

  if (pendingUsers.length === 0) {
    return 0;
  }

  const placeholders = pendingUsers.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
  const values = pendingUsers.flatMap((user) => [
    user.workno,
    user.name,
    user.gender,
    user.age,
    null,
    user.workaddress,
    user.entrydate,
  ]);

  await connection.query(
    `INSERT INTO ${tableName}
      (workno, name, gender, age, idcard, workaddress, entrydate)
    VALUES ${placeholders}`,
    values,
  );

  return pendingUsers.length;
}

async function seedPaginationData(): Promise<void> {
  const connection = await databasePool.getConnection();

  try {
    await connection.beginTransaction();
    const usersCount = await seedTable(connection, "users");
    const sysUsersCount = await seedTable(connection, "sys_user");
    await connection.commit();

    console.log(`users 新增分页测试数据：${usersCount} 条`);
    console.log(`sys_user 新增分页测试数据：${sysUsersCount} 条`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await databasePool.end();
  }
}

seedPaginationData().catch((error: unknown) => {
  console.error("分页测试数据写入失败", error);
  process.exitCode = 1;
});

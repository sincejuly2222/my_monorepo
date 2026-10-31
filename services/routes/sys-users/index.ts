import { Router } from "express";
import { databasePool } from "../../database/index.js";
import type { CountRow, SysUserRow } from "./types.js";

export const sysUsersRouter = Router();

sysUsersRouter.get("/", async (request, response, next) => {
  const page = Number(request.query.page ?? 1);
  const pageSize = Number(request.query.pageSize ?? 20);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    response.status(400).json({
      message: "page 必须是正整数，pageSize 必须是 1 到 100 之间的整数",
    });
    return;
  }

  try {
    const offset = (page - 1) * pageSize;
    const workno = typeof request.query.workno === "string" ? request.query.workno.trim() : "";
    const name = typeof request.query.name === "string" ? request.query.name.trim() : "";
    const conditions: string[] = [];
    const filterValues: string[] = [];

    if (workno) {
      conditions.push("workno LIKE ?");
      filterValues.push(`%${workno}%`);
    }

    if (name) {
      conditions.push("name LIKE ?");
      filterValues.push(`%${name}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [users] = await databasePool.query<SysUserRow[]>(
      `SELECT
        id,
        workno,
        name,
        gender,
        age,
        workaddress,
        DATE_FORMAT(entrydate, '%Y-%m-%d') AS entrydate
      FROM sys_user
      ${whereClause}
      ORDER BY id
      LIMIT ? OFFSET ?`,
      [...filterValues, pageSize, offset],
    );
    const [countRows] = await databasePool.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM sys_user ${whereClause}`,
      filterValues,
    );
    const total = countRows[0]?.total ?? 0;

    response.json({
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

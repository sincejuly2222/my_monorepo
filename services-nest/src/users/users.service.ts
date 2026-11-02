import { Inject, Injectable } from "@nestjs/common";
import type { Pool } from "mysql2/promise";
import { DATABASE_POOL } from "../database/database.module.js";
import type { CountRow, UserListQuery, UserListResponse, UserRow } from "./users.types.js";

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_POOL) private readonly databasePool: Pool) {}

  async findAll(query: UserListQuery): Promise<UserListResponse> {
    const { page, pageSize, workno, name } = query;
    const offset = (page - 1) * pageSize;
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
    const [users] = await this.databasePool.query<UserRow[]>(
      `SELECT
        id,
        workno,
        name,
        gender,
        age,
        workaddress,
        DATE_FORMAT(entrydate, '%Y-%m-%d') AS entrydate
      FROM users
      ${whereClause}
      ORDER BY id
      LIMIT ? OFFSET ?`,
      [...filterValues, pageSize, offset],
    );
    const [countRows] = await this.databasePool.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      filterValues,
    );
    const total = countRows[0]?.total ?? 0;

    return {
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

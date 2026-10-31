import type { RowDataPacket } from "mysql2";
import { databasePool } from "../database/index.js";
import type { AdminUserRecord, AuthRepository } from "./types.js";

interface AdminUserRow extends RowDataPacket {
  id: number;
  username: string;
  displayName: string;
  passwordHash: string;
  isActive: number;
}

function mapAdminUser(row: AdminUserRow | undefined): AdminUserRecord | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    passwordHash: row.passwordHash,
    isActive: row.isActive === 1,
  };
}

export const authRepository: AuthRepository = {
  async findById(id) {
    const [rows] = await databasePool.query<AdminUserRow[]>(
      `SELECT
        id,
        username,
        display_name AS displayName,
        password_hash AS passwordHash,
        is_active AS isActive
      FROM admin_users
      WHERE id = ?
      LIMIT 1`,
      [id],
    );

    return mapAdminUser(rows[0]);
  },

  async findByUsername(username) {
    const [rows] = await databasePool.query<AdminUserRow[]>(
      `SELECT
        id,
        username,
        display_name AS displayName,
        password_hash AS passwordHash,
        is_active AS isActive
      FROM admin_users
      WHERE username = ?
      LIMIT 1`,
      [username],
    );

    return mapAdminUser(rows[0]);
  },

  async updateLastLogin(id) {
    await databasePool.execute(
      "UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [id],
    );
  },
};

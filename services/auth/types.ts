export interface AdminUser {
  id: number;
  username: string;
  displayName: string;
}

export interface AdminUserRecord extends AdminUser {
  passwordHash: string;
  isActive: boolean;
}

export interface AuthRepository {
  findById(id: number): Promise<AdminUserRecord | null>;
  findByUsername(username: string): Promise<AdminUserRecord | null>;
  updateLastLogin(id: number): Promise<void>;
}

export function toAdminUser(record: AdminUserRecord): AdminUser {
  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
  };
}

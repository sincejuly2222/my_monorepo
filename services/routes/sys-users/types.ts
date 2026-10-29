import type { RowDataPacket } from "mysql2";

export interface SysUserRow extends RowDataPacket {
  id: number;
  workno: string;
  name: string;
  gender: string;
  age: number | null;
  workaddress: string | null;
  entrydate: string | null;
}

export interface CountRow extends RowDataPacket {
  total: number;
}

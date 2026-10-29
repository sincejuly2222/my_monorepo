import type { RowDataPacket } from "mysql2";

export interface UserRow extends RowDataPacket {
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

export interface UserInput {
  workno: string;
  name: string;
  gender: string;
  age: number | null;
  workaddress: string | null;
  entrydate: string | null;
}

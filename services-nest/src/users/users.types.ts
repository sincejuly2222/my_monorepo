import type { RowDataPacket } from "mysql2";

export interface User {
  id: number;
  workno: string;
  name: string;
  gender: string;
  age: number | null;
  workaddress: string | null;
  entrydate: string | null;
}

export interface UserListQuery {
  page: number;
  pageSize: number;
  workno: string;
  name: string;
}

export interface UserListResponse {
  data: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UserRow extends RowDataPacket, User {}

export interface CountRow extends RowDataPacket {
  total: number;
}

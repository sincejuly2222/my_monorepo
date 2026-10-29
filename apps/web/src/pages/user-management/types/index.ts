/** 用户列表中的单条数据。 */
export interface SysUser {
  id: number;
  workno: string;
  name: string;
  gender: string;
  age: number | null;
  workaddress: string | null;
  entrydate: string | null;
}

/** 用户分页信息。 */
export interface SysUserPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** 用户列表接口响应。 */
export interface SysUserListResponse {
  data: SysUser[];
  pagination: SysUserPagination;
}

/** 系统用户列表查询参数。 */
export interface SysUserQueryParams {
  page: number;
  pageSize: number;
  workno?: string;
  name?: string;
}

/** 用户列表中的单条数据。 */
export interface User {
  id: number;
  workno: string;
  name: string;
  gender: string;
  age: number | null;
  workaddress: string | null;
  entrydate: string | null;
}

/** 用户分页信息。 */
export interface UserPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** 用户列表接口响应。 */
export interface UserListResponse {
  data: User[];
  pagination: UserPagination;
}

/** 用户列表查询参数。 */
export interface UserQueryParams {
  page: number;
  pageSize: number;
  workno?: string;
  name?: string;
}

/** 用户新增、编辑表单数据。 */
export interface UserFormValues {
  workno: string;
  name: string;
  gender: string;
  age?: number | null;
  workaddress?: string | null;
  entrydate?: string | null;
}

/** 用户变更接口响应。 */
export interface UserMutationResponse {
  message: string;
  data?: {
    id?: number;
    deletedCount?: number;
  };
}

/** 用户导出筛选参数。 */
export interface UserExportParams {
  workno?: string;
  name?: string;
}

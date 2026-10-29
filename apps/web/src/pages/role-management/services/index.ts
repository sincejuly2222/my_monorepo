import { del, get, httpClient, post, put } from "../../../api";
import type {
  UserExportParams,
  UserFormValues,
  UserListResponse,
  UserMutationResponse,
  UserQueryParams,
} from "../types";

/**
 * 分页查询角色管理页面使用的用户列表。
 */
export function getUsers(params: UserQueryParams) {
  return get<UserListResponse>("/users", {
    params,
  });
}

/** 新增用户。 */
export function addUsers(data: UserFormValues) {
  return post<UserMutationResponse, UserFormValues>("/users", data);
}

/** 编辑用户。 */
export function editUser(id: number, data: UserFormValues) {
  return put<UserMutationResponse, UserFormValues>(`/users/${id}`, data);
}

/** 批量删除用户。 */
export function deleteUsers(ids: number[]) {
  return del<UserMutationResponse>("/users", {
    data: { ids },
  });
}

function getDownloadFileName(contentDisposition?: string): string {
  const matchedFileName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];

  if (!matchedFileName) {
    return "角色用户.xlsx";
  }

  return decodeURIComponent(matchedFileName);
}

/** 导出符合当前搜索条件的用户 Excel 文件。 */
export async function exportUsers(params: UserExportParams): Promise<void> {
  const response = await httpClient.get<Blob>("/users/export", {
    params,
    responseType: "blob",
  });
  const fileUrl = URL.createObjectURL(response.data);
  const downloadLink = document.createElement("a");

  downloadLink.href = fileUrl;
  downloadLink.download = getDownloadFileName(response.headers["content-disposition"]);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(fileUrl);
}

import { get } from "../../../api";
import type { SysUserListResponse, SysUserQueryParams } from "../types";

/**
 * 分页查询系统用户列表。
 */
export function getSysUsers(params: SysUserQueryParams) {
  return get<SysUserListResponse>("/sys-users", {
    params,
  });
}

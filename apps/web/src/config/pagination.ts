import type { PaginationProps } from "antd";

/** 后台表格统一使用的中文分页文案。 */
export const zhPaginationLocale: PaginationProps["locale"] = {
  items_per_page: "条/页",
  jump_to: "跳至",
  jump_to_confirm: "确定",
  page: "页",
  prev_page: "上一页",
  next_page: "下一页",
  prev_5: "向前 5 页",
  next_5: "向后 5 页",
  prev_3: "向前 3 页",
  next_3: "向后 3 页",
  page_size: "每页条数",
};

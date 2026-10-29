import { PageContainer, ProTable, type ProColumns } from "@ant-design/pro-components";
import { Tag } from "antd";
import { zhPaginationLocale } from "../../config/pagination";
import { getSysUsers } from "./services";
import type { SysUser } from "./types";

const columns: ProColumns<SysUser>[] = [
  {
    title: "编号",
    dataIndex: "id",
    width: 80,
    search: false,
  },
  {
    title: "工号",
    dataIndex: "workno",
    width: 120,
    copyable: true,
    valueType: "text",
    fieldProps: {
      placeholder: "请输入工号",
      allowClear: true,
    },
  },
  {
    title: "姓名",
    dataIndex: "name",
    width: 120,
    valueType: "text",
    fieldProps: {
      placeholder: "请输入姓名",
      allowClear: true,
    },
  },
  {
    title: "性别",
    dataIndex: "gender",
    width: 90,
    search: false,
    render: (_, record) => (
      <Tag color={record.gender === "男" ? "blue" : "magenta"}>
        {record.gender}
      </Tag>
    ),
  },
  {
    title: "年龄",
    dataIndex: "age",
    width: 90,
    search: false,
    renderText: (age: number | null) => age ?? "-",
  },
  {
    title: "工作地址",
    dataIndex: "workaddress",
    search: false,
    renderText: (workaddress: string | null) => workaddress || "-",
  },
  {
    title: "入职日期",
    dataIndex: "entrydate",
    width: 130,
    search: false,
    renderText: (entrydate: string | null) => entrydate || "-",
  },
];

/**
 * 用户管理页面，展示系统用户分页数据。
 */
export function UserManagementPage() {
  return (
    <PageContainer title="用户管理" subTitle="查看系统用户信息">
      <ProTable<SysUser>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const page = params.current ?? 1;
          const pageSize = params.pageSize ?? 20;
          const result = await getSysUsers({
            page,
            pageSize,
            workno: params.workno,
            name: params.name,
          });

          return {
            data: result.data,
            success: true,
            total: result.pagination.total,
          };
        }}
        search={{
          labelWidth: "auto",
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showQuickJumper: true,
          responsive: true,
          locale: zhPaginationLocale,
          showTotal: (total) => `共 ${total} 条`,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
      />
    </PageContainer>
  );
}

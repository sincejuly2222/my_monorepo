import { useRef, useState, type Key } from "react";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  PageContainer,
  ProTable,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import { App, Button, Popconfirm, Space, Tag } from "antd";
import { zhPaginationLocale } from "../../config/pagination";
import { UserFormModal } from "./components/UserFormModal";
import {
  addUsers,
  deleteUsers,
  editUser,
  exportUsers,
  getUsers,
} from "./services";
import type { User, UserExportParams, UserFormValues } from "./types";

const baseColumns: ProColumns<User>[] = [
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
 * 角色管理页面，目前使用用户列表接口展示基础人员数据。
 */
export function RoleManagementPage() {
  const actionRef = useRef<ActionType>();
  const { message, modal } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportParamsRef = useRef<UserExportParams>({});

  async function handleSubmit(values: UserFormValues): Promise<boolean> {
    setSubmitting(true);

    try {
      const result = editingUser
        ? await editUser(editingUser.id, values)
        : await addUsers(values);

      message.success(result.message);
      setFormOpen(false);
      setEditingUser(null);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作失败");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ids: number[]): Promise<void> {
    try {
      const result = await deleteUsers(ids);
      message.success(result.message);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    }
  }

  async function handleExport(): Promise<void> {
    setExporting(true);

    try {
      await exportUsers(exportParamsRef.current);
      message.success("Excel 导出成功");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }

  const columns: ProColumns<User>[] = [
    ...baseColumns,
    {
      title: "操作",
      valueType: "option",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record);
              setFormOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该用户吗？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDelete([record.id])}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="角色管理" subTitle="查看可分配角色的用户">
      <ProTable<User>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const page = params.current ?? 1;
          const pageSize = params.pageSize ?? 20;
          exportParamsRef.current = {
            workno: params.workno,
            name: params.name,
          };
          const result = await getUsers({
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
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        tableAlertRender={({ selectedRowKeys: keys }) =>
          `已选择 ${keys.length} 项`
        }
        tableAlertOptionRender={() => (
          <Button
            type="link"
            danger
            onClick={() => {
              modal.confirm({
                title: "批量删除用户",
                content: `确认删除已选择的 ${selectedRowKeys.length} 个用户吗？`,
                okText: "删除",
                okButtonProps: { danger: true },
                cancelText: "取消",
                onOk: () =>
                  handleDelete(selectedRowKeys.map((key) => Number(key))),
              });
            }}
          >
            批量删除
          </Button>
        )}
        toolBarRender={() => [
          <Button
            key="export"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={handleExport}
          >
            导出 Excel
          </Button>,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null);
              setFormOpen(true);
            }}
          >
            新增用户
          </Button>,
        ]}
      />

      <UserFormModal
        open={formOpen}
        user={editingUser}
        loading={submitting}
        onCancel={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}

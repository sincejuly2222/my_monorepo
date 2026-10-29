import { useEffect } from "react";
import { Form, Input, InputNumber, Modal, Select } from "antd";
import type { User, UserFormValues } from "../types";

interface UserFormModalProps {
  open: boolean;
  user: User | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => Promise<boolean>;
}

/** 用户新增、编辑共用表单弹窗。 */
export function UserFormModal({
  open,
  user,
  loading,
  onCancel,
  onSubmit,
}: UserFormModalProps) {
  const [form] = Form.useForm<UserFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();

    if (user) {
      form.setFieldsValue({
        workno: user.workno,
        name: user.name,
        gender: user.gender,
        age: user.age,
        workaddress: user.workaddress,
        entrydate: user.entrydate,
      });
    }
  }, [form, open, user]);

  return (
    <Modal
      title={user ? "编辑用户" : "新增用户"}
      open={open}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      destroyOnClose
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form<UserFormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={async (values) => {
          const success = await onSubmit(values);

          if (success) {
            form.resetFields();
          }
        }}
      >
        <Form.Item
          label="工号"
          name="workno"
          rules={[
            { required: true, message: "请输入工号" },
            { max: 10, message: "工号不能超过 10 个字符" },
          ]}
        >
          <Input placeholder="请输入工号" />
        </Form.Item>

        <Form.Item
          label="姓名"
          name="name"
          rules={[
            { required: true, message: "请输入姓名" },
            { max: 10, message: "姓名不能超过 10 个字符" },
          ]}
        >
          <Input placeholder="请输入姓名" />
        </Form.Item>

        <Form.Item
          label="性别"
          name="gender"
          rules={[{ required: true, message: "请选择性别" }]}
        >
          <Select
            placeholder="请选择性别"
            options={[
              { label: "男", value: "男" },
              { label: "女", value: "女" },
            ]}
          />
        </Form.Item>

        <Form.Item label="年龄" name="age">
          <InputNumber
            className="w-full"
            min={0}
            max={255}
            precision={0}
            placeholder="请输入年龄"
          />
        </Form.Item>

        <Form.Item label="工作地址" name="workaddress">
          <Input maxLength={50} placeholder="请输入工作地址" />
        </Form.Item>

        <Form.Item
          label="入职日期"
          name="entrydate"
          rules={[
            {
              pattern: /^\d{4}-\d{2}-\d{2}$/,
              message: "日期格式必须为 YYYY-MM-DD",
            },
          ]}
        >
          <Input type="date" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

import { useEffect, useRef, useState } from "react";
import { DownloadOutlined, FileExcelOutlined, InboxOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Modal,
  Space,
  Typography,
  Upload,
  type UploadFile,
  type UploadProps,
} from "antd";
import type { RcFile } from "antd/es/upload";
import { HttpError } from "../../../../api/http";
import type { UserImportError, UserImportErrorResponse, UserImportResponse } from "../../types";

const { Dragger } = Upload;
const maxFileSize = 5 * 1024 * 1024;

interface UserImportModalProps {
  open: boolean;
  onCancel: () => void;
  onDownloadTemplate: () => Promise<void>;
  onSubmit: (file: File) => Promise<UserImportResponse>;
}

function getImportFailure(error: unknown): {
  message: string;
  errors: UserImportError[];
  totalErrors: number;
} {
  const response = getImportErrorResponse(error);
  if (response) {
    const errors = response?.data?.errors ?? [];
    return {
      message:
        errors.length > 0
          ? "导入校验失败，请根据以下提示修正"
          : (response.message ?? (error instanceof Error ? error.message : "导入失败，请稍后重试")),
      errors,
      totalErrors: response?.data?.totalErrors ?? errors.length,
    };
  }

  return {
    message: error instanceof Error ? error.message : "导入失败，请稍后重试",
    errors: [],
    totalErrors: 0,
  };
}

/** 兼容统一 HttpError、Axios 原始错误及直接抛出的接口响应。 */
function getImportErrorResponse(error: unknown): UserImportErrorResponse | undefined {
  if (error instanceof HttpError) {
    return error.data as UserImportErrorResponse | undefined;
  }
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const candidate = error as {
    data?: unknown;
    response?: { data?: unknown };
  };
  const responseData = candidate.response?.data ?? candidate.data ?? error;
  if (typeof responseData !== "object" || responseData === null) {
    return undefined;
  }

  return responseData as UserImportErrorResponse;
}

/** 人员模板下载、文件选择和导入错误反馈弹窗。 */
export function UserImportModal({
  open,
  onCancel,
  onDownloadTemplate,
  onSubmit,
}: UserImportModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [failure, setFailure] = useState<ReturnType<typeof getImportFailure> | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (failure) {
      errorSummaryRef.current?.focus();
    }
  }, [failure]);

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const isExcel = file.name.toLowerCase().endsWith(".xlsx");
    if (!isExcel) {
      setFailure({ message: "请选择 .xlsx 格式的 Excel 文件", errors: [], totalErrors: 0 });
      return Upload.LIST_IGNORE;
    }
    if (file.size > maxFileSize) {
      setFailure({ message: "文件不能超过 5 MB", errors: [], totalErrors: 0 });
      return Upload.LIST_IGNORE;
    }

    setFailure(null);
    setFileList([
      {
        uid: file.uid,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "done",
        originFileObj: file as RcFile,
      },
    ]);
    return false;
  };

  async function handleDownloadTemplate(): Promise<void> {
    setDownloading(true);
    try {
      await onDownloadTemplate();
    } catch (error) {
      setFailure(getImportFailure(error));
    } finally {
      setDownloading(false);
    }
  }

  async function handleImport(): Promise<void> {
    const file = fileList[0]?.originFileObj;
    if (!file) {
      setFailure({ message: "请先选择填写完成的 Excel 模板", errors: [], totalErrors: 0 });
      return;
    }

    setImporting(true);
    setFailure(null);
    try {
      await onSubmit(file);
    } catch (error) {
      setFailure(getImportFailure(error));
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      title="导入人员信息"
      open={open}
      width={640}
      okText="开始导入"
      cancelText="取消"
      confirmLoading={importing}
      okButtonProps={{ disabled: fileList.length === 0 }}
      cancelButtonProps={{ disabled: importing }}
      closable={!importing}
      maskClosable={!importing}
      keyboard={!importing}
      afterClose={() => {
        setFileList([]);
        setFailure(null);
      }}
      onCancel={onCancel}
      onOk={() => void handleImport()}
    >
      <Space direction="vertical" size={20} className="w-full py-2">
        <div className="flex items-start justify-between gap-6 border-b border-gray-100 pb-4">
          <div>
            <Typography.Text strong>1. 下载标准模板</Typography.Text>
            <Typography.Paragraph type="secondary" className="mb-0 mt-1">
              请勿修改表头。工号、姓名和性别为必填项，单次最多导入 1000 条。
            </Typography.Paragraph>
          </div>
          <Button
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={() => void handleDownloadTemplate()}
          >
            下载模板
          </Button>
        </div>

        <div>
          <Typography.Text strong>2. 上传填写后的模板</Typography.Text>
          <Dragger
            className="mt-3"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            fileList={fileList}
            maxCount={1}
            beforeUpload={beforeUpload}
            onRemove={() => {
              setFileList([]);
              setFailure(null);
              return true;
            }}
          >
            <p className="ant-upload-drag-icon" aria-hidden="true">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽 Excel 文件到此处</p>
            <p className="ant-upload-hint">仅支持 .xlsx，文件不超过 5 MB</p>
          </Dragger>
        </div>

        {failure ? (
          <div ref={errorSummaryRef} role="alert" tabIndex={-1}>
            <Alert
              type="error"
              showIcon
              message={failure.message}
              description={
                failure.errors.length > 0 ? (
                  <div className="mt-2 max-h-44 overflow-auto pr-2">
                    <Typography.Text type="secondary">
                      共 {failure.totalErrors} 处错误，以下为需要修正的内容：
                    </Typography.Text>
                    <ul className="mb-0 mt-2 space-y-1 pl-5">
                      {failure.errors.map((error, index) => (
                        <li key={`${error.row}-${error.field}-${index}`}>
                          {error.row > 0 ? `第 ${error.row} 行` : "文件"} · {error.field}：
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : undefined
              }
            />
          </div>
        ) : fileList.length > 0 ? (
          <Alert
            type="info"
            showIcon
            icon={<FileExcelOutlined />}
            message="文件已就绪"
            description="点击“开始导入”后将进行整批校验；任一行有误时不会写入数据。"
          />
        ) : null}
      </Space>
    </Modal>
  );
}

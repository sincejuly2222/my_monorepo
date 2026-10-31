import ExcelJS, { type Cell, type CellValue } from "exceljs";
import type { UserInput } from "../types.js";
import { validateUserInput } from "../validation.js";

export const importHeaders = ["工号", "姓名", "性别", "年龄", "工作地址", "入职日期"] as const;

export interface UserImportError {
  row: number;
  field: string;
  message: string;
}

export interface ParsedImportUser extends UserInput {
  row: number;
}

export type ParseWorkbookResult =
  | { success: true; users: ParsedImportUser[] }
  | { success: false; errors: UserImportError[]; totalErrors: number };

const importFieldNames: Record<keyof UserInput, string> = {
  workno: "工号",
  name: "姓名",
  gender: "性别",
  age: "年龄",
  workaddress: "工作地址",
  entrydate: "入职日期",
};

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cellValueToText(value: CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return formatDate(value);
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }
    if ("result" in value && value.result !== undefined) {
      return cellValueToText(value.result ?? null);
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text)
        .join("")
        .trim();
    }
  }
  return String(value).trim();
}

function cellText(cell: Cell): string {
  return cellValueToText(cell.value);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** 解析人员导入工作簿，任一行错误时不返回可写入数据。 */
export async function parseUserWorkbook(buffer: Buffer): Promise<ParseWorkbookResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    return {
      success: false,
      errors: [{ row: 0, field: "文件", message: "无法解析 Excel 文件" }],
      totalErrors: 1,
    };
  }

  const worksheet = workbook.getWorksheet("人员信息") ?? workbook.worksheets[0];
  if (!worksheet) {
    return {
      success: false,
      errors: [{ row: 0, field: "文件", message: "Excel 中没有可读取的工作表" }],
      totalErrors: 1,
    };
  }

  const headerIndexes = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    const header = cellText(cell);
    if (header) {
      headerIndexes.set(header, columnNumber);
    }
  });

  const missingHeaders = importHeaders.filter((header) => !headerIndexes.has(header));
  if (missingHeaders.length > 0) {
    return {
      success: false,
      errors: [
        {
          row: 1,
          field: "表头",
          message: `缺少列：${missingHeaders.join("、")}`,
        },
      ],
      totalErrors: 1,
    };
  }

  const users: ParsedImportUser[] = [];
  const errors: UserImportError[] = [];
  const seenWorknos = new Set<string>();
  let nonEmptyRows = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = Object.fromEntries(
      importHeaders.map((header) => [
        header,
        cellText(row.getCell(headerIndexes.get(header) ?? 0)),
      ]),
    );

    if (Object.values(values).every((value) => value === "")) {
      continue;
    }

    nonEmptyRows += 1;
    if (nonEmptyRows > 1_000) {
      errors.push({
        row: rowNumber,
        field: "文件",
        message: "单次最多导入 1000 条人员数据",
      });
      break;
    }

    const validation = validateUserInput({
      workno: values["工号"],
      name: values["姓名"],
      gender: values["性别"],
      age: values["年龄"],
      workaddress: values["工作地址"],
      entrydate: values["入职日期"],
    });

    if (!validation.success) {
      errors.push({
        row: rowNumber,
        field: validation.field ? importFieldNames[validation.field] : "人员信息",
        message: validation.message,
      });
      continue;
    }
    if (validation.data.gender !== "男" && validation.data.gender !== "女") {
      errors.push({ row: rowNumber, field: "性别", message: "性别只能填写男或女" });
      continue;
    }
    if (validation.data.entrydate && !isValidDate(validation.data.entrydate)) {
      errors.push({
        row: rowNumber,
        field: "入职日期",
        message: "入职日期不是有效日期",
      });
      continue;
    }
    if (seenWorknos.has(validation.data.workno)) {
      errors.push({ row: rowNumber, field: "工号", message: "文件内工号重复" });
      continue;
    }

    seenWorknos.add(validation.data.workno);
    users.push({ ...validation.data, row: rowNumber });
  }

  if (nonEmptyRows === 0) {
    errors.push({ row: 0, field: "文件", message: "模板中没有人员数据" });
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors: errors.slice(0, 100),
      totalErrors: errors.length,
    };
  }

  return { success: true, users };
}

/** 创建带填写说明和字段约束的人员导入模板。 */
export async function createUserImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "后台管理系统";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("人员信息", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  worksheet.columns = [
    { header: "工号", key: "workno", width: 16 },
    { header: "姓名", key: "name", width: 16 },
    { header: "性别", key: "gender", width: 10 },
    { header: "年龄", key: "age", width: 10 },
    { header: "工作地址", key: "workaddress", width: 24 },
    { header: "入职日期", key: "entrydate", width: 16 },
  ];
  worksheet.autoFilter = { from: "A1", to: "F1" };

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1677FF" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.getCell("A1").note = "必填，最多 10 个字符，不能重复";
  worksheet.getCell("B1").note = "必填，最多 10 个字符";
  worksheet.getCell("C1").note = "必填，只能填写男或女";
  worksheet.getCell("D1").note = "选填，0 到 255 的整数";
  worksheet.getCell("E1").note = "选填，最多 50 个字符";
  worksheet.getCell("F1").note = "选填，格式为 YYYY-MM-DD";

  for (let row = 2; row <= 1_001; row += 1) {
    worksheet.getCell(`C${row}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"男,女"'],
      showErrorMessage: true,
      errorTitle: "性别格式错误",
      error: "请选择男或女",
    };
    worksheet.getCell(`D${row}`).dataValidation = {
      type: "whole",
      operator: "between",
      allowBlank: true,
      formulae: [0, 255],
      showErrorMessage: true,
      errorTitle: "年龄格式错误",
      error: "年龄必须是 0 到 255 之间的整数",
    };
    worksheet.getCell(`F${row}`).numFmt = "yyyy-mm-dd";
  }

  const instructions = workbook.addWorksheet("填写说明");
  instructions.columns = [
    { key: "item", width: 18 },
    { key: "description", width: 72 },
  ];
  instructions.addRows([
    ["使用方式", "请在“人员信息”工作表中从第 2 行开始填写，完成后上传本文件。"],
    ["必填字段", "工号、姓名、性别。"],
    ["工号", "最多 10 个字符；文件内和系统中均不能重复。"],
    ["性别", "只能填写男或女。"],
    ["年龄", "选填，0 到 255 的整数。"],
    ["入职日期", "选填，格式为 YYYY-MM-DD。"],
    ["导入限制", "单次最多导入 1000 条；任一行校验失败时整批数据不会写入。"],
  ]);
  instructions.getColumn(1).font = { bold: true };
  instructions.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  const fileBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(fileBuffer);
}

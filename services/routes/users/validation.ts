import type { UserInput } from "./types.js";

type ValidationResult =
  | { success: true; data: UserInput }
  | {
      success: false;
      field?: keyof UserInput;
      message: string;
    };

function optionalString(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new Error(`字段长度不能超过 ${maxLength} 个字符`);
  }

  return value.trim();
}

/** 校验并格式化用户新增、编辑参数。 */
export function validateUserInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { success: false, message: "请求参数格式错误" };
  }

  const input = body as Record<string, unknown>;
  const workno = typeof input.workno === "string" ? input.workno.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const gender = typeof input.gender === "string" ? input.gender.trim() : "";

  if (!workno || workno.length > 10) {
    return {
      success: false,
      field: "workno",
      message: "工号不能为空且不能超过 10 个字符",
    };
  }

  if (!name || name.length > 10) {
    return {
      success: false,
      field: "name",
      message: "姓名不能为空且不能超过 10 个字符",
    };
  }

  if (!gender || gender.length > 1) {
    return {
      success: false,
      field: "gender",
      message: "性别不能为空且只能包含 1 个字符",
    };
  }

  const age =
    input.age === undefined || input.age === null || input.age === "" ? null : Number(input.age);

  if (age !== null && (!Number.isInteger(age) || age < 0 || age > 255)) {
    return {
      success: false,
      field: "age",
      message: "年龄必须是 0 到 255 之间的整数",
    };
  }

  let workaddress: string | null;
  try {
    workaddress = optionalString(input.workaddress, 50);
  } catch (error) {
    return {
      success: false,
      field: "workaddress",
      message: error instanceof Error ? error.message : "工作地址格式错误",
    };
  }

  let entrydate: string | null;
  try {
    entrydate = optionalString(input.entrydate, 10);
  } catch (error) {
    return {
      success: false,
      field: "entrydate",
      message: error instanceof Error ? error.message : "入职日期格式错误",
    };
  }

  if (entrydate && !/^\d{4}-\d{2}-\d{2}$/.test(entrydate)) {
    return {
      success: false,
      field: "entrydate",
      message: "入职日期格式必须为 YYYY-MM-DD",
    };
  }

  return {
    success: true,
    data: { workno, name, gender, age, workaddress, entrydate },
  };
}

/** 判断是否为 MySQL 唯一索引冲突。 */
export function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY"
  );
}

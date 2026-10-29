import type { RequestHandler } from "express";
import ExcelJS from "exceljs";
import { databasePool } from "../../../database/index.js";
import type { UserRow } from "../types.js";

/** 导出符合查询条件的用户 Excel 文件。 */
export const exportUsers: RequestHandler = async (request, response, next) => {
  const workno =
    typeof request.query.workno === "string" ? request.query.workno.trim() : "";
  const name =
    typeof request.query.name === "string" ? request.query.name.trim() : "";
  const conditions: string[] = [];
  const filterValues: string[] = [];

  if (workno) {
    conditions.push("workno LIKE ?");
    filterValues.push(`%${workno}%`);
  }

  if (name) {
    conditions.push("name LIKE ?");
    filterValues.push(`%${name}%`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  try {
    const [users] = await databasePool.query<UserRow[]>(
      `SELECT
        id,
        workno,
        name,
        gender,
        age,
        workaddress,
        DATE_FORMAT(entrydate, '%Y-%m-%d') AS entrydate
      FROM users
      ${whereClause}
      ORDER BY id`,
      filterValues,
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "后台管理系统";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("用户列表", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    worksheet.columns = [
      { header: "编号", key: "id", width: 10 },
      { header: "工号", key: "workno", width: 16 },
      { header: "姓名", key: "name", width: 16 },
      { header: "性别", key: "gender", width: 10 },
      { header: "年龄", key: "age", width: 10 },
      { header: "工作地址", key: "workaddress", width: 20 },
      { header: "入职日期", key: "entrydate", width: 16 },
    ];

    worksheet.addRows(users);
    worksheet.autoFilter = {
      from: "A1",
      to: "G1",
    };

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1677FF" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.eachRow((row, rowNumber) => {
      row.alignment = {
        ...row.alignment,
        vertical: "middle",
      };

      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    });

    const fileBuffer = await workbook.xlsx.writeBuffer();
    const fileName = `角色用户_${new Date().toISOString().slice(0, 10)}.xlsx`;

    response.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    response.send(Buffer.from(fileBuffer));
  } catch (error) {
    next(error);
  }
};

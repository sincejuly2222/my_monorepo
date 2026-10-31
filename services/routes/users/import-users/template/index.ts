import type { RequestHandler } from "express";
import { createUserImportTemplate } from "../excel.js";

/** 下载人员导入 Excel 模板。 */
export const downloadUserImportTemplate: RequestHandler = async (_request, response, next) => {
  try {
    const fileBuffer = await createUserImportTemplate();
    const fileName = "角色人员导入模板.xlsx";

    response.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    response.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

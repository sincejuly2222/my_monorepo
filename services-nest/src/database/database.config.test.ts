import { describe, expect, it } from "vitest";
import { getDatabaseConfig } from "./database.config.js";

const REQUIRED_ENVIRONMENT = {
  DB_HOST: "127.0.0.1",
  DB_USER: "root",
  DB_NAME: "my_user",
};

describe("getDatabaseConfig", () => {
  it("应读取配置并补齐默认值", () => {
    expect(getDatabaseConfig(REQUIRED_ENVIRONMENT)).toEqual({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "my_user",
      connectionLimit: 10,
    });
  });

  it("缺少必需配置时应抛出错误", () => {
    expect(() => getDatabaseConfig({ DB_USER: "root", DB_NAME: "my_user" })).toThrow(
      "缺少环境变量：DB_HOST",
    );
  });

  it("端口非正整数时应抛出错误", () => {
    expect(() => getDatabaseConfig({ ...REQUIRED_ENVIRONMENT, DB_PORT: "invalid" })).toThrow(
      "环境变量 DB_PORT 必须是正整数",
    );
  });
});

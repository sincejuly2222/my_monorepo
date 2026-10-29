import { createPool } from "mysql2/promise";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    throw new Error(`缺少环境变量：${name}`);
  }

  return value;
}

function getPositiveIntegerEnv(name: string, defaultValue: number): number {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`环境变量 ${name} 必须是正整数，当前值：${value}`);
  }

  return parsedValue;
}

export const databaseConfig = {
  host: getRequiredEnv("DB_HOST"),
  port: getPositiveIntegerEnv("DB_PORT", 3306),
  user: getRequiredEnv("DB_USER"),
  password: process.env.DB_PASSWORD ?? "",
  database: getRequiredEnv("DB_NAME"),
};

export const databasePool = createPool({
  ...databaseConfig,
  connectionLimit: getPositiveIntegerEnv("DB_CONNECTION_LIMIT", 10),
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
});

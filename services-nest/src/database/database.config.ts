export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

function getRequiredEnvironmentValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }

  return value;
}

function getPositiveIntegerEnvironmentValue(
  environment: NodeJS.ProcessEnv,
  name: string,
  defaultValue: number,
): number {
  const rawValue = environment[name]?.trim();

  if (!rawValue) {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`环境变量 ${name} 必须是正整数，当前值：${rawValue}`);
  }

  return value;
}

export function getDatabaseConfig(environment: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  return {
    host: getRequiredEnvironmentValue(environment, "DB_HOST"),
    port: getPositiveIntegerEnvironmentValue(environment, "DB_PORT", 3306),
    user: getRequiredEnvironmentValue(environment, "DB_USER"),
    password: environment.DB_PASSWORD ?? "",
    database: getRequiredEnvironmentValue(environment, "DB_NAME"),
    connectionLimit: getPositiveIntegerEnvironmentValue(environment, "DB_CONNECTION_LIMIT", 10),
  };
}

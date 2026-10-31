export type RuntimeEnvironment = "development" | "test" | "production";

export interface AppConfig {
  appOrigin: string;
  authJwtAudience: string;
  authJwtIssuer: string;
  authJwtSecret: string;
  authSessionTtlSeconds: number;
  nodeEnv: RuntimeEnvironment;
  port: number;
  trustProxy: boolean | number;
}

function getRequiredEnv(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }

  return value;
}

function getPositiveInteger(value: string, name: string, maximum?: number): number {
  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1 ||
    (maximum !== undefined && parsedValue > maximum)
  ) {
    const maximumMessage = maximum === undefined ? "" : `，且不能大于 ${maximum}`;
    throw new Error(`环境变量 ${name} 必须是正整数${maximumMessage}，当前值：${value}`);
  }

  return parsedValue;
}

function getNodeEnvironment(value: string): RuntimeEnvironment {
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }

  throw new Error(`NODE_ENV 必须是 development、test 或 production，当前值：${value}`);
}

function getAppOrigin(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`APP_ORIGIN 必须是有效的 URL Origin，当前值：${value}`);
  }

  if (url.origin !== value || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`APP_ORIGIN 只能包含协议、主机和端口，且不能以斜杠结尾，当前值：${value}`);
  }

  return url.origin;
}

function getTrustProxy(value: string): AppConfig["trustProxy"] {
  if (value === "false" || value === "0") {
    return false;
  }

  const hopCount = Number(value);

  if (Number.isInteger(hopCount) && hopCount > 0) {
    return hopCount;
  }

  throw new Error(`TRUST_PROXY 必须是 false、0 或正整数，当前值：${value}`);
}

export function getAppConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const authJwtSecret = getRequiredEnv(environment, "AUTH_JWT_SECRET");

  if (Buffer.byteLength(authJwtSecret, "utf8") < 32) {
    throw new Error("AUTH_JWT_SECRET 必须至少包含 32 字节");
  }

  return {
    appOrigin: getAppOrigin(getRequiredEnv(environment, "APP_ORIGIN")),
    authJwtAudience: getRequiredEnv(environment, "AUTH_JWT_AUDIENCE"),
    authJwtIssuer: getRequiredEnv(environment, "AUTH_JWT_ISSUER"),
    authJwtSecret,
    authSessionTtlSeconds: getPositiveInteger(
      getRequiredEnv(environment, "AUTH_SESSION_TTL_SECONDS"),
      "AUTH_SESSION_TTL_SECONDS",
      604_800,
    ),
    nodeEnv: getNodeEnvironment(getRequiredEnv(environment, "NODE_ENV")),
    port: getPositiveInteger(environment.PORT?.trim() || "3000", "PORT", 65_535),
    trustProxy: getTrustProxy(getRequiredEnv(environment, "TRUST_PROXY")),
  };
}

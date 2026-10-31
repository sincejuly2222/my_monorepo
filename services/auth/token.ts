import { jwtVerify, SignJWT } from "jose";
import type { AppConfig } from "../config/index.js";
import type { AdminUserRecord } from "./types.js";

function getJwtKey(config: AppConfig): Uint8Array {
  return new TextEncoder().encode(config.authJwtSecret);
}

export async function createSessionToken(
  adminUser: AdminUserRecord,
  config: AppConfig,
): Promise<string> {
  return new SignJWT({ username: adminUser.username })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(adminUser.id))
    .setIssuer(config.authJwtIssuer)
    .setAudience(config.authJwtAudience)
    .setIssuedAt()
    .setExpirationTime(`${config.authSessionTtlSeconds}s`)
    .sign(getJwtKey(config));
}

export async function verifySessionToken(token: string, config: AppConfig): Promise<number> {
  const { payload } = await jwtVerify(token, getJwtKey(config), {
    algorithms: ["HS256"],
    issuer: config.authJwtIssuer,
    audience: config.authJwtAudience,
  });
  const adminId = Number(payload.sub);

  if (!Number.isSafeInteger(adminId) || adminId < 1 || typeof payload.username !== "string") {
    throw new Error("登录令牌载荷无效");
  }

  return adminId;
}

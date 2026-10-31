import type { CookieOptions } from "express";
import type { AppConfig } from "../config/index.js";

export const sessionCookieName = "admin_session";

export function getSessionCookieOptions(config: AppConfig): CookieOptions {
  return {
    httpOnly: true,
    maxAge: config.authSessionTtlSeconds * 1_000,
    path: "/",
    sameSite: "strict",
    secure: config.nodeEnv === "production",
  };
}

export function getClearSessionCookieOptions(config: AppConfig): CookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: config.nodeEnv === "production",
  };
}

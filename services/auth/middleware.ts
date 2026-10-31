import type { RequestHandler, Response } from "express";
import type { AppConfig } from "../config/index.js";
import { sessionCookieName } from "./cookie.js";
import { verifySessionToken } from "./token.js";
import { toAdminUser, type AdminUser, type AuthRepository } from "./types.js";

export interface AuthenticatedLocals {
  authenticatedAdmin: AdminUser;
}

function sendUnauthorized(response: Response): void {
  response.setHeader("Cache-Control", "no-store");
  response.status(401).json({ message: "未登录或登录已失效" });
}

export function requireAuthentication(
  config: AppConfig,
  repository: AuthRepository,
): RequestHandler<Record<string, never>, unknown, unknown, unknown, AuthenticatedLocals> {
  return async (request, response, next) => {
    const token = request.cookies?.[sessionCookieName];

    if (typeof token !== "string" || token === "") {
      sendUnauthorized(response);
      return;
    }

    let adminId: number;

    try {
      adminId = await verifySessionToken(token, config);
    } catch {
      sendUnauthorized(response);
      return;
    }

    try {
      const adminUser = await repository.findById(adminId);

      if (!adminUser?.isActive) {
        sendUnauthorized(response);
        return;
      }

      response.locals.authenticatedAdmin = toAdminUser(adminUser);
      next();
    } catch (error) {
      next(error);
    }
  };
}

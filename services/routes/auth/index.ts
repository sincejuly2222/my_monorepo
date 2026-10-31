import { Router, type RequestHandler, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import type { AppConfig } from "../../config/index.js";
import {
  getClearSessionCookieOptions,
  getSessionCookieOptions,
  sessionCookieName,
} from "../../auth/cookie.js";
import { requireAuthentication, type AuthenticatedLocals } from "../../auth/middleware.js";
import { verifyDummyPassword, verifyPassword } from "../../auth/password.js";
import { createSessionToken } from "../../auth/token.js";
import { toAdminUser, type AuthRepository } from "../../auth/types.js";

interface LoginBody {
  username?: unknown;
  password?: unknown;
}

interface ValidatedLoginBody {
  username: string;
  password: string;
}

const usernamePattern = /^[A-Za-z0-9._-]{3,64}$/;

function validateLoginBody(body: LoginBody | undefined): ValidatedLoginBody | null {
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return null;
  }

  const username = body.username.trim().toLowerCase();

  if (!usernamePattern.test(username) || body.password.length < 1 || body.password.length > 128) {
    return null;
  }

  return { username, password: body.password };
}

function createLoginRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1_000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({ message: "登录失败次数过多，请稍后再试" });
    },
  });
}

export function createAuthRouter(config: AppConfig, repository: AuthRepository): Router {
  const router = Router();

  router.use((_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });

  router.post("/login", createLoginRateLimiter(), async (request, response, next) => {
    const loginBody = validateLoginBody(request.body as LoginBody | undefined);

    if (!loginBody) {
      response.status(400).json({ message: "用户名或密码格式不正确" });
      return;
    }

    try {
      const adminUser = await repository.findByUsername(loginBody.username);
      const passwordMatches = adminUser
        ? await verifyPassword(adminUser.passwordHash, loginBody.password)
        : await verifyDummyPassword(loginBody.password);

      if (!adminUser || !passwordMatches || !adminUser.isActive) {
        response.status(401).json({ message: "用户名或密码错误" });
        return;
      }

      await repository.updateLastLogin(adminUser.id);
      const token = await createSessionToken(adminUser, config);

      response.cookie(sessionCookieName, token, getSessionCookieOptions(config));
      response.json({
        message: "登录成功",
        data: { user: toAdminUser(adminUser) },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/me",
    requireAuthentication(config, repository),
    (_request, response: Response<unknown, AuthenticatedLocals>) => {
      response.json({ data: { user: response.locals.authenticatedAdmin } });
    },
  );

  router.post("/logout", (_request, response) => {
    response.clearCookie(sessionCookieName, getClearSessionCookieOptions(config));
    response.status(204).send();
  });

  return router;
}

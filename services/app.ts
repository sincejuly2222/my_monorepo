import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import { authRepository } from "./auth/repository.js";
import { requireAuthentication } from "./auth/middleware.js";
import { getAppConfig, type AppConfig } from "./config/index.js";
import { verifyRequestOrigin } from "./middleware/csrf.js";
import { createAuthRouter } from "./routes/auth/index.js";
import { healthRouter } from "./routes/health/index.js";
import { readyRouter } from "./routes/ready/index.js";
import { sysUsersRouter } from "./routes/sys-users/index.js";
import { usersRouter } from "./routes/users/index.js";
import type { AuthRepository } from "./auth/types.js";

export interface CreateAppOptions {
  config?: AppConfig;
  repository?: AuthRepository;
}

export function createApp(options: CreateAppOptions = {}): express.Express {
  const config = options.config ?? getAppConfig();
  const repository = options.repository ?? authRepository;
  const app = express();

  app.set("trust proxy", config.trustProxy);
  app.disable("x-powered-by");
  app.use("/api/auth", (_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json());
  app.use(cookieParser());

  app.use("/health", healthRouter);
  app.use("/ready", readyRouter);

  app.use("/api", verifyRequestOrigin(config.appOrigin));
  app.use("/api/auth", createAuthRouter(config, repository));

  const authentication = requireAuthentication(config, repository);
  app.use("/api/sys-users", authentication, sysUsersRouter);
  app.use("/api/users", authentication, usersRouter);

  app.use((_request: Request, response: Response) => {
    response.status(404).json({ message: "接口不存在" });
  });

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    console.error(error);

    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({ message: "请求体不是有效的 JSON" });
      return;
    }

    response.status(500).json({ message: "服务器内部错误" });
  };

  app.use(errorHandler);

  return app;
}

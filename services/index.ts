import "dotenv/config";
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from "express";
import { databasePool } from "./database/index.js";
import { healthRouter } from "./routes/health/index.js";
import { readyRouter } from "./routes/ready/index.js";
import { sysUsersRouter } from "./routes/sys-users/index.js";
import { usersRouter } from "./routes/users/index.js";

const app = express();
const defaultPort = 3000;

function getPort(value: string | undefined): number {
  if (value === undefined) {
    return defaultPort;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`PORT 必须是 1 到 65535 之间的整数，当前值：${value}`);
  }

  return port;
}

app.use(express.json());

app.use("/health", healthRouter);
app.use("/ready", readyRouter);
app.use("/api/sys-users", sysUsersRouter);
app.use("/api/users", usersRouter);

app.use((_request: Request, response: Response) => {
  response.status(404).json({ message: "接口不存在" });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "服务器内部错误" });
};

app.use(errorHandler);

const port = getPort(process.env.PORT);

async function startServer(): Promise<void> {
  try {
    await databasePool.query("SELECT 1");
    console.log("MySQL 连接成功");

    app.listen(port, () => {
      console.log(`服务已启动：http://localhost:${port}`);
    });
  } catch (error) {
    console.error("MySQL 连接失败，服务未启动", error);
    await databasePool.end();
    process.exitCode = 1;
  }
}

void startServer();

import "dotenv/config";
import { createApp } from "./app.js";
import { getAppConfig } from "./config/index.js";
import { databasePool } from "./database/index.js";

async function startServer(): Promise<void> {
  try {
    const config = getAppConfig();
    await databasePool.query("SELECT 1");
    console.log("MySQL 连接成功");

    const app = createApp({ config });
    app.listen(config.port, () => {
      console.log(`服务已启动：http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("服务启动失败", error);
    await databasePool.end();
    process.exitCode = 1;
  }
}

void startServer();

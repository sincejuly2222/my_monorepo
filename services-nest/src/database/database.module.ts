import { Inject, Injectable, Module, type OnApplicationShutdown } from "@nestjs/common";
import { createPool, type Pool } from "mysql2/promise";
import { getDatabaseConfig } from "./database.config.js";

export const DATABASE_POOL = Symbol("DATABASE_POOL");

async function createDatabasePool(): Promise<Pool> {
  const pool = createPool({
    ...getDatabaseConfig(),
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
  });

  try {
    await pool.query("SELECT 1");
    return pool;
  } catch (error) {
    await pool.end();
    throw error;
  }
}

@Injectable()
class DatabasePoolLifecycle implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: createDatabasePool,
    },
    DatabasePoolLifecycle,
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}

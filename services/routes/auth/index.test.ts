import { SignJWT } from "jose";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { hashPassword } from "../../auth/password.js";
import type { AdminUserRecord, AuthRepository } from "../../auth/types.js";
import type { AppConfig } from "../../config/index.js";

const appOrigin = "http://localhost:5173";
const validPassword = "correct-password-123";

const testConfig: AppConfig = {
  appOrigin,
  authJwtAudience: "my-monorepo-web",
  authJwtIssuer: "my-monorepo-api",
  authJwtSecret: "test-secret-that-is-at-least-32-bytes-long",
  authSessionTtlSeconds: 7_200,
  nodeEnv: "test",
  port: 3_000,
  trustProxy: false,
};

let passwordHash = "";

class MemoryAuthRepository implements AuthRepository {
  public admin: AdminUserRecord | null = {
    id: 1,
    username: "admin",
    displayName: "系统管理员",
    passwordHash: "",
    isActive: true,
  };

  public lastLoginAdminId: number | null = null;

  async findById(id: number): Promise<AdminUserRecord | null> {
    return this.admin?.id === id ? this.admin : null;
  }

  async findByUsername(username: string): Promise<AdminUserRecord | null> {
    return this.admin?.username === username ? this.admin : null;
  }

  async updateLastLogin(id: number): Promise<void> {
    this.lastLoginAdminId = id;
  }
}

function createRepository(): MemoryAuthRepository {
  const repository = new MemoryAuthRepository();

  if (repository.admin) {
    repository.admin.passwordHash = passwordHash;
  }

  return repository;
}

function getCookie(response: request.Response): string {
  const setCookie = response.headers["set-cookie"];
  const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;

  if (!cookieHeader) {
    throw new Error("响应未设置 Cookie");
  }

  return cookieHeader;
}

async function createCustomToken(
  config: AppConfig,
  options: { issuer?: string; audience?: string; expiresAt?: number } = {},
): Promise<string> {
  return new SignJWT({ username: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("1")
    .setIssuer(options.issuer ?? config.authJwtIssuer)
    .setAudience(options.audience ?? config.authJwtAudience)
    .setIssuedAt()
    .setExpirationTime(options.expiresAt ?? Math.floor(Date.now() / 1_000) + 3_600)
    .sign(new TextEncoder().encode(config.authJwtSecret));
}

beforeAll(async () => {
  passwordHash = await hashPassword(validPassword);
});

describe("管理员认证接口", () => {
  let repository: MemoryAuthRepository;

  beforeEach(() => {
    repository = createRepository();
  });

  it("登录成功后设置安全 Cookie，并标准化用户名", async () => {
    const app = createApp({ config: testConfig, repository });
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", appOrigin)
      .send({ username: "  ADMIN ", password: validPassword })
      .expect(200);

    expect(response.body).toEqual({
      message: "登录成功",
      data: { user: { id: 1, username: "admin", displayName: "系统管理员" } },
    });
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(repository.lastLoginAdminId).toBe(1);

    const cookie = getCookie(response);
    expect(cookie).toContain("admin_session=");
    expect(cookie).toContain("Max-Age=7200");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).not.toContain("Secure");
  });

  it("生产环境登录 Cookie 带有 Secure", async () => {
    const app = createApp({
      config: { ...testConfig, nodeEnv: "production" },
      repository,
    });
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", appOrigin)
      .send({ username: "admin", password: validPassword })
      .expect(200);

    expect(getCookie(response)).toContain("Secure");
  });

  it("无效登录参数返回 400", async () => {
    const app = createApp({ config: testConfig, repository });

    await request(app)
      .post("/api/auth/login")
      .set("Origin", appOrigin)
      .send({ username: "?", password: "" })
      .expect(400, { message: "用户名或密码格式不正确" });
  });

  it.each([
    ["密码错误", { username: "admin", password: "wrong-password" }],
    ["账号不存在", { username: "nobody", password: "wrong-password" }],
  ])("%s时返回相同的 401", async (_scenario, body) => {
    const app = createApp({ config: testConfig, repository });

    await request(app)
      .post("/api/auth/login")
      .set("Origin", appOrigin)
      .send(body)
      .expect(401, { message: "用户名或密码错误" });
  });

  it("停用账号返回通用 401", async () => {
    if (repository.admin) {
      repository.admin.isActive = false;
    }

    const app = createApp({ config: testConfig, repository });
    await request(app)
      .post("/api/auth/login")
      .set("Origin", appOrigin)
      .send({ username: "admin", password: validPassword })
      .expect(401, { message: "用户名或密码错误" });
  });

  it("读取当前管理员，并在签发后停用时使会话失效", async () => {
    const app = createApp({ config: testConfig, repository });
    const agent = request.agent(app);

    await agent
      .post("/api/auth/login")
      .set("Origin", appOrigin)
      .send({ username: "admin", password: validPassword })
      .expect(200);

    await agent.get("/api/auth/me").expect(200, {
      data: { user: { id: 1, username: "admin", displayName: "系统管理员" } },
    });

    if (repository.admin) {
      repository.admin.isActive = false;
    }

    await agent.get("/api/auth/me").expect(401, { message: "未登录或登录已失效" });
  });

  it("没有 Cookie 时拒绝认证接口和业务接口", async () => {
    const app = createApp({ config: testConfig, repository });

    await request(app).get("/api/auth/me").expect(401, { message: "未登录或登录已失效" });
    await request(app).get("/api/users").expect(401, { message: "未登录或登录已失效" });
    await request(app).get("/api/sys-users").expect(401, { message: "未登录或登录已失效" });
  });

  it("登录后可以通过业务路由鉴权", async () => {
    const app = createApp({ config: testConfig, repository });
    const agent = request.agent(app);

    await agent
      .post("/api/auth/login")
      .set("Origin", appOrigin)
      .send({ username: "admin", password: validPassword })
      .expect(200);
    await agent.get("/api/users?page=0").expect(400);
  });

  it.each([
    ["过期", { expiresAt: 1 }],
    ["issuer 错误", { issuer: "wrong-issuer" }],
    ["audience 错误", { audience: "wrong-audience" }],
  ])("拒绝%s的 Cookie", async (_scenario, tokenOptions) => {
    const app = createApp({ config: testConfig, repository });
    const token = await createCustomToken(testConfig, tokenOptions);

    await request(app)
      .get("/api/auth/me")
      .set("Cookie", `admin_session=${token}`)
      .expect(401, { message: "未登录或登录已失效" });
  });

  it("拒绝被篡改的 Cookie", async () => {
    const app = createApp({ config: testConfig, repository });
    const token = await createCustomToken(testConfig);

    await request(app)
      .get("/api/auth/me")
      .set("Cookie", `admin_session=${token.slice(0, -1)}x`)
      .expect(401, { message: "未登录或登录已失效" });
  });

  it("退出时清除 Cookie，即使请求没有有效会话", async () => {
    const app = createApp({ config: testConfig, repository });
    const response = await request(app)
      .post("/api/auth/logout")
      .set("Origin", appOrigin)
      .expect(204);

    const cookie = getCookie(response);
    expect(cookie).toContain("admin_session=");
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
  });
});

describe("请求来源校验", () => {
  it("允许正确 Origin 或 Referer，拒绝错误和缺失来源", async () => {
    const app = createApp({ config: testConfig, repository: createRepository() });
    const body = { username: "admin", password: validPassword };

    await request(app).post("/api/auth/login").set("Origin", appOrigin).send(body).expect(200);
    await request(app)
      .post("/api/auth/login")
      .set("Referer", `${appOrigin}/login`)
      .send(body)
      .expect(200);
    await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://evil.example")
      .send(body)
      .expect(403, { message: "请求来源校验失败" });
    await request(app)
      .post("/api/auth/login")
      .send(body)
      .expect(403, { message: "请求来源校验失败" });
  });

  it("安全 GET 请求不要求 Origin", async () => {
    const app = createApp({ config: testConfig, repository: createRepository() });

    await request(app).get("/api/auth/me").expect(401);
  });
});

describe("登录限流", () => {
  it("同一 IP 在 15 分钟内第 11 次失败时返回 429", async () => {
    const app = createApp({ config: testConfig, repository: createRepository() });
    const body = { username: "admin", password: "wrong-password" };

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      await request(app).post("/api/auth/login").set("Origin", appOrigin).send(body).expect(401);
    }

    await request(app)
      .post("/api/auth/login")
      .set("Origin", appOrigin)
      .send(body)
      .expect(429, { message: "登录失败次数过多，请稍后再试" });
  });

  it("成功登录不计入失败次数", async () => {
    const app = createApp({ config: testConfig, repository: createRepository() });
    const body = { username: "admin", password: validPassword };

    for (let attempt = 1; attempt <= 11; attempt += 1) {
      await request(app).post("/api/auth/login").set("Origin", appOrigin).send(body).expect(200);
    }
  });

  it("配置一层反向代理时按客户端 IP 分别限流", async () => {
    const app = createApp({
      config: { ...testConfig, trustProxy: 1 },
      repository: createRepository(),
    });
    const body = { username: "admin", password: "wrong-password" };

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      await request(app)
        .post("/api/auth/login")
        .set("Origin", appOrigin)
        .set("X-Forwarded-For", "203.0.113.10")
        .send(body)
        .expect(401);
    }

    await request(app)
      .post("/api/auth/login")
      .set("Origin", appOrigin)
      .set("X-Forwarded-For", "203.0.113.11")
      .send(body)
      .expect(401);
  });
});

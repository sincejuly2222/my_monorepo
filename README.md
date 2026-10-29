# my-monorepo

基于 pnpm workspace 的 TypeScript monorepo。目前包含 Express 服务项目，并预留 Web 应用和共享包目录。

## 环境要求

- Node.js 20 或更高版本
- pnpm 10.8.0

## 项目结构

```text
.
├─ apps/web/           # Web 应用（待完善）
├─ packages/shared/    # 跨工作区共享包（待完善）
└─ services/           # Express + TypeScript 服务
```

## 安装依赖

```bash
pnpm install
```

## 开发启动

首次启动前，复制服务环境变量示例：

```powershell
Copy-Item services/.env.example services/.env
```

然后根据本机 MySQL 修改 `services/.env`。该文件包含密码且已被 Git 忽略，不应提交。

从仓库根目录启动所有已配置 `dev` 脚本的工作区：

```bash
pnpm dev
```

只启动服务项目：

```bash
pnpm dev:services
```

只启动 Web 项目：

```bash
pnpm dev:web
```

服务默认监听 `http://localhost:3000`。可通过 `PORT` 环境变量修改端口。

## 生产启动

`pnpm start` 会先构建所有已配置 `build` 脚本的工作区，再启动所有已配置 `start` 脚本的工作区：

```bash
pnpm start
```

已有接口：

- `GET /health`：服务健康检查
- `GET /ready`：MySQL 数据库就绪检查
- `GET /api/sys-users?page=1&pageSize=20`：分页查询系统用户
- `GET /api/users?page=1&pageSize=20`：分页查询用户

## 常用命令

```bash
pnpm build            # 构建所有工作区
pnpm build:web        # 构建 Web 项目
pnpm typecheck        # 检查所有工作区的 TypeScript 类型
pnpm test             # 运行所有已配置的测试
pnpm dev:services     # 以开发模式启动服务
pnpm start:services   # 启动已构建的服务
pnpm --filter @my-monorepo/services db:migrate # 执行数据库迁移
```

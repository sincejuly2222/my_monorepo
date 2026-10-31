# my-monorepo

基于 pnpm workspace 的 TypeScript monorepo，目前包含 React Web 应用、Express 服务和共享包目录。

## 环境要求

- Node.js 20.19+、22.13+ 或 24+
- pnpm 10.8.0

## 项目结构

```text
.
├─ apps/web/           # React Web 应用
├─ packages/shared/    # 跨工作区共享包（待完善）
└─ services/           # Express + TypeScript 服务
```

## 安装依赖

```bash
pnpm install
```

## 开发启动

首次启动前，复制服务环境变量示例：

```bash
cp services/.env.example services/.env
```

然后根据本机 MySQL 修改 `services/.env`。该文件包含密码且已被 Git 忽略，不应提交。

登录鉴权还需要在 `services/.env` 中设置 `APP_ORIGIN` 和 JWT 配置。开发环境可保留示例中的 issuer、audience 和两小时有效期，但必须替换 `AUTH_JWT_SECRET`。可用以下命令生成随机密钥：

```bash
openssl rand -base64 48
```

本地直连服务时将 `TRUST_PROXY` 设为 `0`；生产环境仅经过一层可信 Nginx 代理时设为 `1`。

首次执行数据库迁移时，会自动创建 `DB_NAME` 指定的数据库；MySQL 账号需要具备 `CREATE` 数据库权限。

执行迁移并创建首个管理员：

```bash
pnpm --filter @my-monorepo/services db:migrate

export ADMIN_USERNAME=admin
export ADMIN_DISPLAY_NAME=系统管理员
read -s "ADMIN_PASSWORD?管理员密码（12–128 个字符）："
export ADMIN_PASSWORD
pnpm --filter @my-monorepo/services auth:create-admin
unset ADMIN_USERNAME ADMIN_DISPLAY_NAME ADMIN_PASSWORD
```

用户名会去除首尾空格并转为小写。同名管理员默认不会被覆盖；需要重置密码和显示名时，使用相同环境变量并显式追加 `--reset-password`。该操作不会改变账号的启用状态：

```bash
pnpm --filter @my-monorepo/services auth:create-admin -- --reset-password
```

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
- `POST /api/auth/login`：管理员登录并设置 HttpOnly Cookie
- `GET /api/auth/me`：读取当前登录管理员
- `POST /api/auth/logout`：清除登录 Cookie
- `GET /api/sys-users?page=1&pageSize=20`：分页查询系统用户（需要登录）
- `GET /api/users?page=1&pageSize=20`：分页查询用户（需要登录）
- `GET /api/users/import/template`：下载角色人员导入模板（需要登录）
- `POST /api/users/import`：上传 `.xlsx` 模板并整批导入人员（需要登录）

登录 Cookie 名为 `admin_session`，有效期两小时，仅允许浏览器脚本不可读的 HttpOnly Cookie 传递。所有 `/api` 下的写请求都必须携带与 `APP_ORIGIN` 完全一致的 `Origin`；没有 `Origin` 时服务会回退校验 `Referer`。

以下命令可完成登录、读取当前管理员和退出调试。`-c` 将 Cookie 写入临时文件，`-b` 在后续请求中发送 Cookie：

```bash
curl -i -c /tmp/my-monorepo-cookie.txt \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:5173' \
  --data '{"username":"admin","password":"请替换为管理员密码"}' \
  http://localhost:3000/api/auth/login

curl -i -b /tmp/my-monorepo-cookie.txt \
  http://localhost:3000/api/auth/me

curl -i -b /tmp/my-monorepo-cookie.txt \
  -H 'Origin: http://localhost:5173' \
  -X POST http://localhost:3000/api/auth/logout
```

生产环境 Cookie 会增加 `Secure` 属性，因此必须通过 HTTPS 使用。认证响应不返回 JWT 或密码哈希，并统一禁止缓存。

## 常用命令

```bash
pnpm build            # 构建所有工作区
pnpm build:web        # 构建 Web 项目
pnpm typecheck        # 检查所有工作区的 TypeScript 类型
pnpm test             # 运行所有已配置的测试
pnpm lint             # 使用 ESLint 检查整个仓库
pnpm lint:fix         # 自动修复可安全修复的 ESLint 问题
pnpm format           # 使用 Prettier 格式化整个仓库
pnpm format:check     # 检查代码是否符合 Prettier 规范
pnpm dev:services     # 以开发模式启动服务
pnpm start:services   # 启动已构建的服务
pnpm --filter @my-monorepo/services db:migrate # 执行数据库迁移
pnpm --filter @my-monorepo/services auth:create-admin # 创建管理员
```

## 代码规范

整个仓库统一使用根目录的 ESLint 和 Prettier 配置，TypeScript、React、Node.js、JSON、YAML、Markdown 和样式文件均通过根命令检查或格式化。各工作区也提供相同的 `lint`、`lint:fix`、`format` 和 `format:check` 脚本，便于按工作区执行。

前端组件统一使用“组件目录 + `index.tsx`”结构，例如：

```text
src/
├─ App/index.tsx
├─ layouts/AdminLayout/index.tsx
└─ pages/role-management/components/UserImportModal/index.tsx
```

`main.tsx` 是应用启动入口，不属于 React 组件，因此保留入口文件命名。新增组件时，目录使用 `PascalCase`，实现文件统一命名为 `index.tsx`；页面目录继续使用小写 kebab-case，并以 `index.tsx` 作为入口。

## 角色人员导入

角色管理页面支持下载标准 Excel 模板并导入人员。模板包含工号、姓名、性别、年龄、工作地址和入职日期，单次最多导入 1000 条，文件不能超过 5 MB。

导入接口会先校验全部数据，包括字段格式、文件内重复工号和数据库已有工号。任一行存在错误时整批数据不会写入，页面会显示对应行号和修正原因。

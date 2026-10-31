# 数据库迁移

迁移文件使用递增编号命名，例如：

```text
001_create_users.sql
002_create_admin_users.sql
```

执行迁移：

```bash
pnpm --filter @my-monorepo/services db:migrate
```

迁移脚本会先连接 MySQL 服务器，并根据 `DB_NAME` 自动创建不存在的数据库。执行账号需要具备 `CREATE` 数据库权限。

迁移文件执行成功后会记录到 `schema_migrations` 表，已经执行的文件不会重复运行。已执行的迁移文件不得修改，应新增迁移完成后续变更。

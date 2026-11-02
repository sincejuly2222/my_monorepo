import type { Pool } from "mysql2/promise";
import { describe, expect, it, vi } from "vitest";
import { UsersService } from "./users.service.js";

describe("UsersService", () => {
  it("应按工号和姓名查询分页用户列表", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([
        [
          {
            id: 1,
            workno: "A001",
            name: "张三",
            gender: "男",
            age: 30,
            workaddress: "上海",
            entrydate: "2024-01-02",
          },
        ],
        [],
      ])
      .mockResolvedValueOnce([[{ total: 21 }], []]);
    const service = new UsersService({ query } as unknown as Pool);

    const result = await service.findAll({
      page: 2,
      pageSize: 10,
      workno: "A00",
      name: "张",
    });

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("WHERE workno LIKE ? AND name LIKE ?"),
      ["%A00%", "%张%", 10, 10],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("WHERE workno LIKE ? AND name LIKE ?"),
      ["%A00%", "%张%"],
    );
    expect(result).toEqual({
      data: [
        {
          id: 1,
          workno: "A001",
          name: "张三",
          gender: "男",
          age: 30,
          workaddress: "上海",
          entrydate: "2024-01-02",
        },
      ],
      pagination: {
        page: 2,
        pageSize: 10,
        total: 21,
        totalPages: 3,
      },
    });
  });

  it("无筛选条件时应查询默认分页", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[{ total: 0 }], []]);
    const service = new UsersService({ query } as unknown as Pool);

    const result = await service.findAll({ page: 1, pageSize: 20, workno: "", name: "" });

    expect(query).toHaveBeenNthCalledWith(1, expect.not.stringContaining("WHERE"), [20, 0]);
    expect(query).toHaveBeenNthCalledWith(2, expect.not.stringContaining("WHERE"), []);
    expect(result).toEqual({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
  });
});

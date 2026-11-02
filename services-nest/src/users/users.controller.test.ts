import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { UsersController } from "./users.controller.js";
import type { UsersService } from "./users.service.js";
import type { UserListResponse } from "./users.types.js";

const EMPTY_RESPONSE: UserListResponse = {
  data: [],
  pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
};

describe("UsersController", () => {
  it("应整理查询参数并返回用户列表", async () => {
    const findAll = vi.fn().mockResolvedValue(EMPTY_RESPONSE);
    const controller = new UsersController({ findAll } as unknown as UsersService);

    const result = await controller.findAll("2", "10", " A00 ", " 张 ");

    expect(findAll).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      workno: "A00",
      name: "张",
    });
    expect(result).toBe(EMPTY_RESPONSE);
  });

  it("未传分页参数时应使用默认值", async () => {
    const findAll = vi.fn().mockResolvedValue(EMPTY_RESPONSE);
    const controller = new UsersController({ findAll } as unknown as UsersService);

    await controller.findAll();

    expect(findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      workno: "",
      name: "",
    });
  });

  it.each([
    ["0", "20"],
    ["1.5", "20"],
    ["1", "0"],
    ["1", "101"],
  ])("应拒绝非法分页参数 page=%s pageSize=%s", async (page, pageSize) => {
    const controller = new UsersController({ findAll: vi.fn() } as unknown as UsersService);

    await expect(controller.findAll(page, pageSize)).rejects.toBeInstanceOf(BadRequestException);
  });
});

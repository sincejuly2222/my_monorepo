import { BadRequestException, Controller, Get, Inject, Query } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import type { UserListResponse } from "./users.types.js";

const INVALID_PAGINATION_MESSAGE = "page 必须是正整数，pageSize 必须是 1 到 100 之间的整数";

@Controller("api/users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query("page") rawPage?: unknown,
    @Query("pageSize") rawPageSize?: unknown,
    @Query("workno") rawWorkno?: unknown,
    @Query("name") rawName?: unknown,
  ): Promise<UserListResponse> {
    const page = Number(rawPage ?? 1);
    const pageSize = Number(rawPageSize ?? 20);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      throw new BadRequestException({ message: INVALID_PAGINATION_MESSAGE });
    }

    return this.usersService.findAll({
      page,
      pageSize,
      workno: typeof rawWorkno === "string" ? rawWorkno.trim() : "",
      name: typeof rawName === "string" ? rawName.trim() : "",
    });
  }
}

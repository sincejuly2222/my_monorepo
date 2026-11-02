import { describe, expect, it } from "vitest";
import { AppService } from "./app.service.js";

describe("AppService", () => {
  it("应返回默认问候语", () => {
    const service = new AppService();

    expect(service.getHello()).toBe("Hello World!");
  });
});

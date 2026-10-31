import type { RequestHandler } from "express";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

function getRequestOrigin(
  originHeader: string | undefined,
  refererHeader: string | undefined,
): string | null {
  if (originHeader) {
    return originHeader;
  }

  if (!refererHeader) {
    return null;
  }

  try {
    return new URL(refererHeader).origin;
  } catch {
    return null;
  }
}

export function verifyRequestOrigin(appOrigin: string): RequestHandler {
  return (request, response, next) => {
    if (safeMethods.has(request.method)) {
      next();
      return;
    }

    const requestOrigin = getRequestOrigin(request.get("origin"), request.get("referer"));

    if (requestOrigin !== appOrigin) {
      response.status(403).json({ message: "请求来源校验失败" });
      return;
    }

    next();
  };
}

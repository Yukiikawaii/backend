import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[error]", err);
  res.status(500).json({
    status: "server_error",
    message: "Something went wrong. Please try again.",
  });
}

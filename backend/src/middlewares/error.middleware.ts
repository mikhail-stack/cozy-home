import type { ErrorRequestHandler } from "express";
import { HttpError } from "../lib/errors.js";

// Ошибки body-parser (битый JSON и т.п.) приходят с status 4xx.
const isClientError = (error: unknown): error is { status: number } =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  typeof error.status === "number" &&
  error.status >= 400 &&
  error.status < 500;

// Четыре параметра обязательны — по ним Express узнаёт error-handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (isClientError(error)) {
    res.status(error.status).json({ message: "Некорректный запрос" });
    return;
  }
  console.error(error);
  res.status(500).json({ message: "Внутренняя ошибка сервера" });
};

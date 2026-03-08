import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

interface PrismaClientKnownRequestError {
  code: string;
  meta?: Record<string, unknown>;
  message: string;
  name: string;
}

interface ZodValidationError {
  name: string;
  issues: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

interface MulterError {
  name: string;
  code: string;
  field?: string;
  message: string;
}

function isPrismaError(error: unknown): error is PrismaClientKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as Record<string, unknown>).name === "PrismaClientKnownRequestError"
  );
}

function isZodError(error: unknown): error is ZodValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as Record<string, unknown>).name === "ZodError"
  );
}

function isMulterError(error: unknown): error is MulterError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as Record<string, unknown>).name === "MulterError"
  );
}

function handlePrismaError(error: PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case "P2002":
      return new AppError(
        `A record with that ${(error.meta?.target as string[])?.join(", ") ?? "value"} already exists.`,
        409
      );
    case "P2025":
      return new AppError("Record not found.", 404);
    case "P2003":
      return new AppError("Related record not found.", 400);
    case "P2014":
      return new AppError("This operation violates a required relation.", 400);
    default:
      return new AppError("A database error occurred.", 500);
  }
}

function handleZodError(error: ZodValidationError): AppError {
  const messages = error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );
  const appError = new AppError(`Validation failed: ${messages.join("; ")}`, 400);
  return appError;
}

function handleMulterError(error: MulterError): AppError {
  switch (error.code) {
    case "LIMIT_FILE_SIZE":
      return new AppError("File is too large.", 400);
    case "LIMIT_FILE_COUNT":
      return new AppError("Too many files.", 400);
    case "LIMIT_UNEXPECTED_FILE":
      return new AppError(`Unexpected file field: ${error.field}`, 400);
    default:
      return new AppError("File upload error.", 400);
  }
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === "production";

  // Handle known error types
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(!isProduction && { stack: err.stack }),
    });
    return;
  }

  if (isPrismaError(err)) {
    const prismaAppError = handlePrismaError(err);
    res.status(prismaAppError.statusCode).json({
      success: false,
      message: prismaAppError.message,
    });
    return;
  }

  if (isZodError(err)) {
    const zodAppError = handleZodError(err);
    res.status(zodAppError.statusCode).json({
      success: false,
      message: zodAppError.message,
    });
    return;
  }

  if (isMulterError(err)) {
    const multerAppError = handleMulterError(err);
    res.status(multerAppError.statusCode).json({
      success: false,
      message: multerAppError.message,
    });
    return;
  }

  // Unknown errors
  const error = err instanceof Error ? err : new Error(String(err));
  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    message: isProduction ? "Internal server error" : error.message,
    ...(!isProduction && { stack: error.stack }),
  });
};

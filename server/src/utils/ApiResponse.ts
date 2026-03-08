import { Response } from "express";

interface SuccessResponseBody<T = unknown> {
  success: true;
  message: string;
  data: T;
}

interface ErrorResponseBody {
  success: false;
  message: string;
  details?: unknown;
}

export const ApiResponse = {
  success<T = unknown>(
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200
  ): Response<SuccessResponseBody<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },

  error(
    res: Response,
    message = "Something went wrong",
    statusCode = 500,
    details?: unknown
  ): Response<ErrorResponseBody> {
    const body: ErrorResponseBody = {
      success: false,
      message,
    };

    if (details !== undefined) {
      body.details = details;
    }

    return res.status(statusCode).json(body);
  },
};

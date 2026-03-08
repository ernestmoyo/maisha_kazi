import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";
import { auth } from "../middleware/auth.js";
import { NotificationService } from "../services/NotificationService.js";

const router = Router();

router.use(auth);

// ─── GET /api/notifications ─────────────────────────────────────────────────

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { page = "1", limit = "10" } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = { userId: user.id };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return ApiResponse.success(res, {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// ─── GET /api/notifications/unread-count ────────────────────────────────────

router.get(
  "/unread-count",
  asyncHandler(async (req: Request, res: Response) => {
    const count = await NotificationService.getUnreadCount(req.user!.id);
    return ApiResponse.success(res, { count });
  })
);

// ─── PATCH /api/notifications/read-all ──────────────────────────────────────

router.patch(
  "/read-all",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await NotificationService.markAllAsRead(req.user!.id);
    return ApiResponse.success(res, { updated: result.count }, "All notifications marked as read");
  })
);

// ─── PATCH /api/notifications/:id/read ──────────────────────────────────────

router.patch(
  "/:id/read",
  asyncHandler(async (req: Request, res: Response) => {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id as string },
    });

    if (!notification) {
      throw new AppError("Notification not found.", 404);
    }

    if (notification.userId !== req.user!.id) {
      throw new AppError("You can only read your own notifications.", 403);
    }

    const result = await NotificationService.markAsRead(req.params.id as string, req.user!.id);

    if (result.count === 0) {
      throw new AppError("Notification not found.", 404);
    }

    return ApiResponse.success(res, null, "Notification marked as read");
  })
);

export default router;

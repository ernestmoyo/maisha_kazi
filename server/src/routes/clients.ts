import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";
import { auth, authorize } from "../middleware/auth.js";

const router = Router();

router.use(auth);

// ─── GET /api/clients ───────────────────────────────────────────────────────

router.get(
  "/",
  authorize("COORDINATOR"),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = "1", limit = "10" } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = { role: "CLIENT" as const };

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          clientProfile: {
            select: {
              id: true,
              orgName: true,
              orgLogo: true,
              industry: true,
              csrBudget: true,
              primaryContactName: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return ApiResponse.success(res, {
      clients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// ─── GET /api/clients/:id ───────────────────────────────────────────────────

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const clientUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        clientProfile: {
          select: {
            id: true,
            orgName: true,
            orgLogo: true,
            industry: true,
            csrBudget: true,
            brandColor: true,
            primaryContactName: true,
          },
        },
      },
    });

    if (!clientUser || clientUser.role !== "CLIENT") {
      throw new AppError("Client not found.", 404);
    }

    return ApiResponse.success(res, clientUser);
  })
);

// ─── GET /api/clients/:id/csr-report ────────────────────────────────────────

router.get(
  "/:id/csr-report",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const clientId = req.params.id;

    // Only the client themselves or a coordinator can view CSR reports
    if (user.role === "CLIENT" && user.id !== clientId) {
      throw new AppError("You can only view your own CSR report.", 403);
    }
    if (user.role === "YOUTH") {
      throw new AppError("Youth cannot view CSR reports.", 403);
    }

    const clientUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        role: true,
        name: true,
        clientProfile: { select: { orgName: true } },
      },
    });

    if (!clientUser || clientUser.role !== "CLIENT") {
      throw new AppError("Client not found.", 404);
    }

    // Total jobs and amounts
    const jobStats = await prisma.job.aggregate({
      where: { clientId, status: "COMPLETED" },
      _count: true,
      _sum: { fee: true, youthEarning: true },
    });

    // Distinct youth paid
    const distinctYouth = await prisma.job.findMany({
      where: { clientId, status: "COMPLETED", youthId: { not: null } },
      select: { youthId: true },
      distinct: ["youthId"],
    });

    // Jobs grouped by serviceType
    const jobsByServiceType = await prisma.job.groupBy({
      by: ["serviceType"],
      where: { clientId, status: "COMPLETED" },
      _count: true,
      _sum: { fee: true },
    });

    // Monthly trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const completedJobs = await prisma.job.findMany({
      where: {
        clientId,
        status: "COMPLETED",
        completedAt: { gte: twelveMonthsAgo },
      },
      select: { completedAt: true, fee: true },
      orderBy: { completedAt: "asc" },
    });

    // Build monthly trend
    const monthlyTrend: Array<{ month: string; jobCount: number; totalSpent: number }> = [];
    const monthMap = new Map<string, { jobCount: number; totalSpent: number }>();

    for (const job of completedJobs) {
      if (!job.completedAt) continue;
      const key = `${job.completedAt.getFullYear()}-${String(job.completedAt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthMap.get(key) || { jobCount: 0, totalSpent: 0 };
      entry.jobCount++;
      entry.totalSpent += Number(job.fee);
      monthMap.set(key, entry);
    }

    for (const [month, data] of monthMap.entries()) {
      monthlyTrend.push({ month, ...data });
    }

    return ApiResponse.success(res, {
      client: {
        name: clientUser.name,
        orgName: clientUser.clientProfile?.orgName,
      },
      totalJobs: jobStats._count,
      totalYouthPaid: distinctYouth.length,
      totalAmount: jobStats._sum.fee ?? 0,
      totalYouthEarnings: jobStats._sum.youthEarning ?? 0,
      jobsByServiceType: jobsByServiceType.map((g: { serviceType: string; _count: number; _sum: { fee: unknown } }) => ({
        serviceType: g.serviceType,
        count: g._count,
        totalFee: g._sum.fee ?? 0,
      })),
      monthlyTrend,
    });
  })
);

export default router;

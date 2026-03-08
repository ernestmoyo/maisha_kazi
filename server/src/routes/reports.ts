import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";
import { auth, authorize } from "../middleware/auth.js";

const router = Router();

router.use(auth);

// ─── GET /api/reports/coordinator-summary ───────────────────────────────────

router.get(
  "/coordinator-summary",
  authorize("COORDINATOR"),
  asyncHandler(async (_req: Request, res: Response) => {
    const now = new Date();

    // Start of this week (Monday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      activeYouth,
      openJobs,
      completedThisWeek,
      totalEarningsResult,
      recentActivity,
    ] = await Promise.all([
      // Active youth count (vetted and active users)
      prisma.user.count({
        where: {
          role: "YOUTH",
          isActive: true,
          youthProfile: { isVetted: true },
        },
      }),

      // Open jobs count
      prisma.job.count({
        where: { status: "OPEN" },
      }),

      // Jobs completed this week
      prisma.job.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startOfWeek },
        },
      }),

      // Total platform earnings (maisha cuts)
      prisma.job.aggregate({
        where: { status: "COMPLETED" },
        _sum: { fee: true, maishaCut: true, youthEarning: true },
      }),

      // Recent activity (latest 20 jobs with updates)
      prisma.job.findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          status: true,
          serviceType: true,
          fee: true,
          createdAt: true,
          updatedAt: true,
          client: { select: { id: true, name: true } },
          youth: { select: { id: true, name: true } },
        },
      }),
    ]);

    return ApiResponse.success(res, {
      activeYouth,
      openJobs,
      completedThisWeek,
      totalEarnings: {
        totalFees: totalEarningsResult._sum.fee ?? 0,
        maishaCut: totalEarningsResult._sum.maishaCut ?? 0,
        youthEarnings: totalEarningsResult._sum.youthEarning ?? 0,
      },
      recentActivity,
    });
  })
);

// ─── GET /api/reports/platform-stats ────────────────────────────────────────

router.get(
  "/platform-stats",
  authorize("COORDINATOR"),
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      totalJobs,
      completedJobs,
      totalYouth,
      totalClients,
      revenueResult,
      ratingResult,
      jobsByServiceType,
      monthlyCompletions,
      earningsData,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.user.count({ where: { role: "YOUTH" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.job.aggregate({
        where: { status: "COMPLETED" },
        _sum: { fee: true },
      }),
      prisma.youthProfile.aggregate({ _avg: { rating: true } }),
      prisma.job.groupBy({
        by: ["serviceType"],
        _count: true,
        orderBy: { _count: { serviceType: "desc" } },
      }),
      // Last 12 months of completions
      prisma.job.findMany({
        where: {
          status: "COMPLETED",
          completedAt: {
            gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
          },
        },
        select: { completedAt: true },
        orderBy: { completedAt: "asc" },
      }),
      // Youth earnings for distribution
      prisma.youthProfile.findMany({
        select: { totalEarnings: true },
        where: { totalEarnings: { gt: 0 } },
      }),
    ]);

    // Build monthly completions map
    const monthMap = new Map<string, number>();
    for (const job of monthlyCompletions) {
      if (!job.completedAt) continue;
      const key = `${job.completedAt.getFullYear()}-${String(
        job.completedAt.getMonth() + 1
      ).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }
    const monthlyCompletionsFormatted = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, completed]) => ({ month, completed }));

    // Build earnings distribution
    const ranges = [
      { label: "0–50k", min: 0, max: 50000 },
      { label: "50–100k", min: 50000, max: 100000 },
      { label: "100–250k", min: 100000, max: 250000 },
      { label: "250k+", min: 250000, max: Infinity },
    ];
    const youthEarningsDistribution = ranges.map((r) => ({
      range: r.label,
      count: earningsData.filter((y) => {
        const e = Number(y.totalEarnings);
        return e >= r.min && e < r.max;
      }).length,
    }));

    return ApiResponse.success(res, {
      platformStats: {
        totalJobs,
        completedJobs,
        totalYouth,
        totalClients,
        totalRevenue: revenueResult._sum?.fee ?? 0,
        averageRating: ratingResult._avg?.rating ?? 0,
      },
      jobsByServiceType: jobsByServiceType.map((g) => ({
        serviceType: g.serviceType,
        count: g._count,
      })),
      monthlyCompletions: monthlyCompletionsFormatted,
      youthEarningsDistribution,
    });
  })
);

// ─── GET /api/reports/csr/:clientId ─────────────────────────────────────────

router.get(
  "/csr/:clientId",
  authorize("COORDINATOR"),
  asyncHandler(async (req: Request, res: Response) => {
    const clientId = req.params.clientId as string;

    const clientUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        role: true,
        name: true,
        email: true,
        clientProfile: {
          select: {
            orgName: true,
            orgLogo: true,
            industry: true,
            csrBudget: true,
            brandColor: true,
          },
        },
      },
    });

    if (!clientUser || clientUser.role !== "CLIENT") {
      throw new AppError("Client not found.", 404);
    }

    // Comprehensive CSR data
    const [jobStats, distinctYouth, jobsByServiceType, jobsByStatus, recentCompletedJobs] =
      await Promise.all([
        prisma.job.aggregate({
          where: { clientId },
          _count: true,
          _sum: { fee: true, youthEarning: true, maishaCut: true },
        }),

        prisma.job.findMany({
          where: { clientId, status: "COMPLETED", youthId: { not: null } },
          select: { youthId: true },
          distinct: ["youthId"],
        }),

        prisma.job.groupBy({
          by: ["serviceType"],
          where: { clientId },
          _count: true,
          _sum: { fee: true },
        }),

        prisma.job.groupBy({
          by: ["status"],
          where: { clientId },
          _count: true,
        }),

        prisma.job.findMany({
          where: { clientId, status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            serviceType: true,
            fee: true,
            youthEarning: true,
            completedAt: true,
            youth: { select: { id: true, name: true } },
          },
        }),
      ]);

    // Monthly trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const completedJobs = await prisma.job.findMany({
      where: {
        clientId,
        status: "COMPLETED",
        completedAt: { gte: twelveMonthsAgo },
      },
      select: { completedAt: true, fee: true, youthEarning: true },
      orderBy: { completedAt: "asc" },
    });

    const monthlyTrend: Array<{
      month: string;
      jobCount: number;
      totalSpent: number;
      youthPaid: number;
    }> = [];
    const monthMap = new Map<
      string,
      { jobCount: number; totalSpent: number; youthPaid: number }
    >();

    for (const job of completedJobs) {
      if (!job.completedAt) continue;
      const key = `${job.completedAt.getFullYear()}-${String(job.completedAt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthMap.get(key) || { jobCount: 0, totalSpent: 0, youthPaid: 0 };
      entry.jobCount++;
      entry.totalSpent += Number(job.fee);
      entry.youthPaid += Number(job.youthEarning ?? 0);
      monthMap.set(key, entry);
    }

    for (const [month, data] of monthMap.entries()) {
      monthlyTrend.push({ month, ...data });
    }

    return ApiResponse.success(res, {
      client: {
        name: clientUser.name,
        email: clientUser.email,
        profile: clientUser.clientProfile,
      },
      summary: {
        totalJobs: jobStats._count,
        totalYouthPaid: distinctYouth.length,
        totalAmount: jobStats._sum?.fee ?? 0,
        totalYouthEarnings: jobStats._sum?.youthEarning ?? 0,
        totalMaishaFees: jobStats._sum?.maishaCut ?? 0,
      },
      jobsByServiceType: jobsByServiceType.map((g) => ({
        serviceType: g.serviceType,
        count: g._count,
        totalFee: g._sum?.fee ?? 0,
      })),
      jobsByStatus: jobsByStatus.map((g) => ({
        status: g.status,
        count: g._count,
      })),
      monthlyTrend,
      recentCompletedJobs,
    });
  })
);

export default router;

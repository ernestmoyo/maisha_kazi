import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";
import { auth, authorize } from "../middleware/auth.js";
import type { Prisma } from "../generated/prisma/client.js";

const router = Router();

router.use(auth);

// ─── GET /api/youth ─────────────────────────────────────────────────────────

router.get(
  "/",
  authorize("COORDINATOR"),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      search,
      isVetted,
      skills,
      page = "1",
      limit = "10",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const userWhere: Prisma.UserWhereInput = {
      role: "YOUTH",
    };

    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const profileWhere: Prisma.YouthProfileWhereInput = {};

    if (isVetted !== undefined) {
      profileWhere.isVetted = isVetted === "true";
    }

    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim());
      profileWhere.skills = { hasSome: skillList };
    }

    if (Object.keys(profileWhere).length > 0) {
      userWhere.youthProfile = profileWhere;
    }

    const [youth, total] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
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
          youthProfile: {
            select: {
              id: true,
              bio: true,
              location: true,
              skills: true,
              rating: true,
              totalJobsCompleted: true,
              totalEarnings: true,
              isVetted: true,
              vettedAt: true,
              profilePhotoUrl: true,
            },
          },
        },
      }),
      prisma.user.count({ where: userWhere }),
    ]);

    return ApiResponse.success(res, {
      youth,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// ─── GET /api/youth/:id ─────────────────────────────────────────────────────

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const youthUser = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        youthProfile: {
          select: {
            id: true,
            bio: true,
            location: true,
            locationLat: true,
            locationLng: true,
            skills: true,
            rating: true,
            totalJobsCompleted: true,
            totalEarnings: true,
            isVetted: true,
            vettedAt: true,
            vettedBy: { select: { id: true, name: true } },
            idDocumentUrl: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    if (!youthUser || youthUser.role !== "YOUTH") {
      throw new AppError("Youth not found.", 404);
    }

    return ApiResponse.success(res, youthUser);
  })
);

// ─── PATCH /api/youth/:id/profile ───────────────────────────────────────────

router.patch(
  "/:id/profile",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const targetId = req.params.id as string;

    if (user.role === "YOUTH" && user.id !== targetId) {
      throw new AppError("You can only update your own profile.", 403);
    }

    if (user.role === "CLIENT") {
      throw new AppError("Clients cannot update youth profiles.", 403);
    }

    const youthUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true },
    });

    if (!youthUser || youthUser.role !== "YOUTH") {
      throw new AppError("Youth not found.", 404);
    }

    const youthProfile = await prisma.youthProfile.findUnique({
      where: { userId: targetId },
      select: { id: true },
    });

    if (!youthProfile) {
      throw new AppError("Youth profile not found.", 404);
    }

    const { bio, location, phone, skills } = req.body as {
      bio?: string;
      location?: string;
      phone?: string;
      skills?: string[];
    };

    const profileData: Prisma.YouthProfileUpdateInput = {};
    if (bio !== undefined) profileData.bio = bio;
    if (location !== undefined) profileData.location = location;
    if (skills !== undefined) profileData.skills = skills;

    const [updatedProfile] = await Promise.all([
      prisma.youthProfile.update({
        where: { id: youthProfile.id },
        data: profileData,
      }),
      phone !== undefined
        ? prisma.user.update({ where: { id: targetId }, data: { phone } })
        : Promise.resolve(null),
    ]);

    return ApiResponse.success(res, updatedProfile, "Profile updated successfully.");
  })
);

// ─── PATCH /api/youth/:id/vet ───────────────────────────────────────────────

router.patch(
  "/:id/vet",
  authorize("COORDINATOR"),
  asyncHandler(async (req: Request, res: Response) => {
    const youthUser = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: { role: true, youthProfile: { select: { id: true, isVetted: true } } },
    });

    if (!youthUser || youthUser.role !== "YOUTH") {
      throw new AppError("Youth not found.", 404);
    }

    if (!youthUser.youthProfile) {
      throw new AppError("Youth profile not found.", 404);
    }

    if (youthUser.youthProfile.isVetted) {
      throw new AppError("Youth is already vetted.", 400);
    }

    const updatedProfile = await prisma.youthProfile.update({
      where: { id: youthUser.youthProfile.id },
      data: {
        isVetted: true,
        vettedAt: new Date(),
        vettedById: req.user!.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        vettedBy: { select: { id: true, name: true } },
      },
    });

    return ApiResponse.success(res, updatedProfile, "Youth vetted successfully");
  })
);

// ─── GET /api/youth/:id/earnings ────────────────────────────────────────────

router.get(
  "/:id/earnings",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const youthId = req.params.id as string;

    // Youth can only see their own earnings; coordinators can see any
    if (user.role === "YOUTH" && user.id !== youthId) {
      throw new AppError("You can only view your own earnings.", 403);
    }

    if (user.role === "CLIENT") {
      throw new AppError("Clients cannot view youth earnings.", 403);
    }

    const youthUser = await prisma.user.findUnique({
      where: { id: youthId },
      select: { role: true },
    });

    if (!youthUser || youthUser.role !== "YOUTH") {
      throw new AppError("Youth not found.", 404);
    }

    const now = new Date();

    // Start of this week (Monday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedJobsBase: { youthId: string; status: "COMPLETED" } = {
      youthId,
      status: "COMPLETED",
    };

    const [weekJobs, monthJobs, allTimeJobs, recentJobs] = await Promise.all([
      prisma.job.aggregate({
        where: { ...completedJobsBase, completedAt: { gte: startOfWeek } },
        _sum: { youthEarning: true },
        _count: true,
      }),
      prisma.job.aggregate({
        where: { ...completedJobsBase, completedAt: { gte: startOfMonth } },
        _sum: { youthEarning: true },
        _count: true,
      }),
      prisma.job.aggregate({
        where: completedJobsBase,
        _sum: { youthEarning: true },
        _count: true,
      }),
      prisma.job.findMany({
        where: completedJobsBase,
        orderBy: { completedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          serviceType: true,
          fee: true,
          youthEarning: true,
          completedAt: true,
          client: { select: { id: true, name: true } },
        },
      }),
    ]);

    return ApiResponse.success(res, {
      thisWeek: {
        earnings: weekJobs._sum.youthEarning ?? 0,
        jobCount: weekJobs._count,
      },
      thisMonth: {
        earnings: monthJobs._sum.youthEarning ?? 0,
        jobCount: monthJobs._count,
      },
      allTime: {
        earnings: allTimeJobs._sum.youthEarning ?? 0,
        jobCount: allTimeJobs._count,
      },
      recentJobs,
    });
  })
);

export default router;

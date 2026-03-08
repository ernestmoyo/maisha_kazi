import { Router, Request, Response } from "express";
import { z } from "zod/v4";
import prisma from "../utils/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";
import { auth, authorize } from "../middleware/auth.js";
import { NotificationService } from "../services/NotificationService.js";
import type { Prisma } from "../generated/prisma/client.js";

const router = Router();

// All routes require authentication
router.use(auth);

// ─── Schemas ────────────────────────────────────────────────────────────────

const createJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  serviceType: z.enum(["CAR_WASH", "CLEANING", "GARDENING", "WINDOW_FIX", "HANDYWORK", "OTHER"]),
  location: z.string().min(1, "Location is required"),
  fee: z.number().positive("Fee must be positive"),
  scheduledAt: z.iso.datetime().optional(),
  notes: z.string().optional(),
  clientId: z.string().uuid().optional(),
});

const assignJobSchema = z.object({
  youthId: z.string().uuid("Invalid youth ID"),
});

const updateStatusSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DISPUTED", "CANCELLED"]),
});

// ─── GET /api/jobs ──────────────────────────────────────────────────────────

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const {
      status,
      serviceType,
      page = "1",
      limit = "10",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.JobWhereInput = {};

    // Role-based filtering
    if (user.role === "YOUTH") {
      where.youthId = user.id;
    } else if (user.role === "CLIENT") {
      where.clientId = user.id;
    }
    // COORDINATOR sees all

    if (status) {
      where.status = status as Prisma.EnumJobStatusFilter;
    }
    if (serviceType) {
      where.serviceType = serviceType as Prisma.EnumServiceTypeFilter;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, name: true, email: true } },
          youth: { select: { id: true, name: true, email: true } },
          coordinator: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return ApiResponse.success(res, {
      jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// ─── POST /api/jobs ─────────────────────────────────────────────────────────

router.post(
  "/",
  authorize("COORDINATOR", "CLIENT"),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const data = createJobSchema.parse(req.body);

    let clientId = data.clientId;

    if (user.role === "CLIENT") {
      clientId = user.id;
    } else if (!clientId) {
      throw new AppError("clientId is required when creating a job as coordinator.", 400);
    }

    // Verify the client exists and has CLIENT role
    const clientUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: { role: true },
    });

    if (!clientUser || clientUser.role !== "CLIENT") {
      throw new AppError("Invalid client ID.", 400);
    }

    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        serviceType: data.serviceType,
        location: data.location,
        fee: data.fee,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        notes: data.notes,
        clientId,
        coordinatorId: user.role === "COORDINATOR" ? user.id : undefined,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true, email: true } },
      },
    });

    return ApiResponse.success(res, job, "Job created successfully", 201);
  })
);

// ─── GET /api/jobs/:id ──────────────────────────────────────────────────────

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id as string },
      include: {
        client: { select: { id: true, name: true, email: true } },
        youth: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            youthProfile: {
              select: {
                bio: true,
                skills: true,
                rating: true,
                totalJobsCompleted: true,
                isVetted: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        coordinator: { select: { id: true, name: true, email: true } },
        applications: {
          include: {
            youth: { select: { id: true, name: true, email: true } },
          },
        },
        payments: true,
      },
    });

    if (!job) {
      throw new AppError("Job not found.", 404);
    }

    return ApiResponse.success(res, job);
  })
);

// ─── PATCH /api/jobs/:id/assign ─────────────────────────────────────────────

router.patch(
  "/:id/assign",
  authorize("COORDINATOR"),
  asyncHandler(async (req: Request, res: Response) => {
    const { youthId } = assignJobSchema.parse(req.body);

    const job = await prisma.job.findUnique({ where: { id: req.params.id as string } });
    if (!job) {
      throw new AppError("Job not found.", 404);
    }

    if (job.status !== "OPEN") {
      throw new AppError("Only open jobs can be assigned.", 400);
    }

    // Verify youth exists and has YOUTH role
    const youthUser = await prisma.user.findUnique({
      where: { id: youthId },
      select: { role: true, youthProfile: { select: { isVetted: true } } },
    });

    if (!youthUser || youthUser.role !== "YOUTH") {
      throw new AppError("Invalid youth ID.", 400);
    }

    const fee = Number(job.fee);
    const maishaCut = parseFloat((fee * 0.2).toFixed(2));
    const youthEarning = parseFloat((fee * 0.8).toFixed(2));

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id as string },
      data: {
        youthId,
        status: "ASSIGNED",
        coordinatorId: req.user!.id,
        maishaCut,
        youthEarning,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        youth: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify the youth
    await NotificationService.createNotification(
      youthId,
      `You have been assigned to job: ${job.title}`,
      "JOB_ASSIGNED"
    );

    return ApiResponse.success(res, updatedJob, "Youth assigned to job successfully");
  })
);

// ─── PATCH /api/jobs/:id/status ─────────────────────────────────────────────

router.patch(
  "/:id/status",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { status: newStatus } = updateStatusSchema.parse(req.body);

    const job = await prisma.job.findUnique({ where: { id: req.params.id as string } });
    if (!job) {
      throw new AppError("Job not found.", 404);
    }

    if (user.role === "CLIENT") {
      throw new AppError("Clients cannot change job status directly. Use the confirm endpoint.", 403);
    }

    if (user.role === "YOUTH") {
      // Youth can only update their own assigned jobs
      if (job.youthId !== user.id) {
        throw new AppError("You are not assigned to this job.", 403);
      }

      // Youth transitions: ASSIGNED -> IN_PROGRESS, IN_PROGRESS -> COMPLETED
      if (job.status === "ASSIGNED" && newStatus === "IN_PROGRESS") {
        // Valid transition
      } else if (job.status === "IN_PROGRESS" && newStatus === "COMPLETED") {
        if (!job.proofPhotoUrl) {
          throw new AppError("Proof photo must be uploaded before marking job as completed.", 400);
        }
      } else {
        throw new AppError(
          `Youth cannot change status from ${job.status} to ${newStatus}.`,
          400
        );
      }
    }

    // Coordinator can make any status change (no additional validation)

    const updateData: Prisma.JobUpdateInput = { status: newStatus };
    if (newStatus === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, email: true } },
        youth: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify relevant parties
    if (newStatus === "COMPLETED" && job.clientId) {
      await NotificationService.createNotification(
        job.clientId,
        `Job "${job.title}" has been marked as completed.`,
        "JOB_COMPLETED"
      );
    }

    return ApiResponse.success(res, updatedJob, `Job status updated to ${newStatus}`);
  })
);

// ─── PATCH /api/jobs/:id/confirm ────────────────────────────────────────────

router.patch(
  "/:id/confirm",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    const job = await prisma.job.findUnique({ where: { id: req.params.id as string } });
    if (!job) {
      throw new AppError("Job not found.", 404);
    }

    if (job.clientId !== user.id) {
      throw new AppError("Only the job's client can confirm completion.", 403);
    }

    if (job.status !== "COMPLETED") {
      throw new AppError("Job must be completed before it can be confirmed.", 400);
    }

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id as string },
      data: { clientConfirmed: true },
      include: {
        client: { select: { id: true, name: true, email: true } },
        youth: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify youth and coordinator
    if (job.youthId) {
      await NotificationService.createNotification(
        job.youthId,
        `Client confirmed completion for job: ${job.title}`,
        "JOB_COMPLETED"
      );
    }

    return ApiResponse.success(res, updatedJob, "Job completion confirmed by client");
  })
);

export default router;

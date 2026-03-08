import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";
import { auth, authorize } from "../middleware/auth.js";
import {
  uploadProofPhoto,
  uploadProfilePhoto,
  uploadDocument,
} from "../middleware/upload.js";
import { UploadService } from "../services/UploadService.js";

const router = Router();

// All routes require authentication
router.use(auth);

// ─── POST /api/jobs/:id/proof ───────────────────────────────────────────────

router.post(
  "/jobs/:id/proof",
  authorize("YOUTH"),
  uploadProofPhoto,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const jobId = req.params.id;

    if (!req.file) {
      throw new AppError("No photo file uploaded.", 400);
    }

    // Fetch the job and verify ownership + status
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) {
      throw new AppError("Job not found.", 404);
    }

    if (job.youthId !== user.id) {
      throw new AppError("You are not assigned to this job.", 403);
    }

    if (job.status !== "IN_PROGRESS") {
      throw new AppError(
        "Proof photos can only be uploaded for jobs that are IN_PROGRESS.",
        400
      );
    }

    // Validate and strip EXIF/GPS metadata
    await UploadService.validateImage(req.file.path);
    await UploadService.stripExifAndSave(req.file.path);

    const proofPhotoUrl = UploadService.getUploadUrl(req.file.filename);

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        proofPhotoUrl,
        proofUploadedAt: new Date(),
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        youth: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true, email: true } },
      },
    });

    return ApiResponse.success(
      res,
      updatedJob,
      "Proof photo uploaded successfully"
    );
  })
);

// ─── POST /api/uploads/profile-photo ────────────────────────────────────────

router.post(
  "/uploads/profile-photo",
  uploadProfilePhoto,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    if (!req.file) {
      throw new AppError("No photo file uploaded.", 400);
    }

    // Validate and strip EXIF/GPS metadata
    await UploadService.validateImage(req.file.path);
    await UploadService.stripExifAndSave(req.file.path);

    const profilePhotoUrl = UploadService.getUploadUrl(req.file.filename);

    // Update the youth profile if the user is a youth, otherwise store on a generic basis
    if (user.role === "YOUTH") {
      await prisma.youthProfile.update({
        where: { userId: user.id },
        data: { profilePhotoUrl },
      });
    }

    return ApiResponse.success(
      res,
      { profilePhotoUrl },
      "Profile photo uploaded successfully"
    );
  })
);

// ─── POST /api/uploads/id-document ──────────────────────────────────────────

router.post(
  "/uploads/id-document",
  authorize("YOUTH"),
  uploadDocument,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    if (!req.file) {
      throw new AppError("No document file uploaded.", 400);
    }

    const idDocumentUrl = UploadService.getUploadUrl(req.file.filename);

    await prisma.youthProfile.update({
      where: { userId: user.id },
      data: { idDocumentUrl },
    });

    return ApiResponse.success(
      res,
      { idDocumentUrl },
      "ID document uploaded successfully"
    );
  })
);

export default router;

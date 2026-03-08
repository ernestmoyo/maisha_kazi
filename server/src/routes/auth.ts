import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { auth } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// POST /register - Register a new user
router.post('/register', asyncHandler(authController.register));

// POST /login - Login with email and password
router.post('/login', asyncHandler(authController.login));

// POST /refresh - Refresh access token
router.post('/refresh', asyncHandler(authController.refresh));

// GET /me - Get current authenticated user's profile
router.get('/me', auth, asyncHandler(authController.getMe));

export default router;

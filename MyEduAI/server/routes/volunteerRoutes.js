// backend/routes/volunteerRoutes.js
import express from 'express';
import { generateAvailabilityForm, createCourseController } from '../controllers/volunteerController.js';

const router = express.Router();

// 🔹 Existing route
router.post('/generate-availability-form', generateAvailabilityForm);

// 🔹 New route to create a course
router.post('/courses', createCourseController);

export default router;

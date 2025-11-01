import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createAppointment, getMyAppointments } from '../controllers/appointmentsController.js';

const router = Router();

router.post('/', authMiddleware, createAppointment);
router.get('/me', authMiddleware, getMyAppointments);

export default router;


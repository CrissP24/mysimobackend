import { Router } from 'express';
import { authMiddleware, requireRoleOrOwner } from '../middleware/authMiddleware.js';
import { listDoctors, getDoctorById, createDoctor, updateDoctor } from '../controllers/doctorsController.js';

const router = Router();

router.get('/', listDoctors);
router.get('/:id', getDoctorById);
router.post('/', authMiddleware, requireRoleOrOwner(['admin']), createDoctor);
router.put('/:id', authMiddleware, updateDoctor);

export default router;


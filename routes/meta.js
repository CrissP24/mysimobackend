import { Router } from 'express';
import { getSpecialties, getCities } from '../controllers/metaController.js';

const router = Router();

router.get('/specialties', getSpecialties);
router.get('/cities', getCities);

export default router;


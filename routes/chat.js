import { Router } from 'express';
import { chatPlaceholder } from '../controllers/chatController.js';

const router = Router();

router.post('/', chatPlaceholder);

export default router;


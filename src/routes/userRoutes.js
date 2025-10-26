import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getMe,
  updateMe,
  updateUserAvatar,
} from '../controllers/userController.js';
import { upload } from '../middleware/multer.js';

const router = Router();

router.patch(
  '/users/me/avatar',
  authenticate,
  upload.single('avatar'),
  updateUserAvatar,
);
router.get('/users/me', authenticate, getMe);
router.patch('/users/me', authenticate, updateMe);

export default router;

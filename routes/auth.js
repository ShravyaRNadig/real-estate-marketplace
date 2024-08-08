import express from 'express';
import * as auth from '../controllers/auth.js';
import { requireSignin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', requireSignin, auth.api);
router.post("/login", auth.login);
router.post('/forgot-password', auth.forgotPassword);

export default router;

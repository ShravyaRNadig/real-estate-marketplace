import express from 'express';
import * as ad from '../controllers/ad.js';
import { requireSignin } from '../middlewares/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', requireSignin, upload.any(), ad.uploadImage);
router.delete('/remove-image', requireSignin, ad.removeImage);
router.post('/create-ad',ad.createAd);

export default router;

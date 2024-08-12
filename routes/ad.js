import express from 'express';
import * as ad from '../controllers/ad.js';
import { requireSignin } from '../middlewares/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', requireSignin, upload.any(), ad.uploadImage);
router.delete('/remove-image', requireSignin, ad.removeImage);
router.post('/create-ad', requireSignin, ad.createAd);
router.get('/ad/:slug', ad.readAd);
router.get('/ads-for-sell/:page', ad.listAdsForSell);
router.get('/ads-for-rent/:page', ad.listAdsForRent);
router.put('/update-ad/:slug', requireSignin, ad.updateAd);
router.delete('/delete-ad/:slug', requireSignin, ad.deleteAd);

router.get('/user-ads/:page', requireSignin, ad.userAds);
router.put('/update-ad-status/:slug', requireSignin, ad.updateAdStatus);
router.post('/contact-agent', requireSignin, ad.contactAgent);

export default router;

import express from 'express';
import { createZaloPayTest, callback, checkZaloPayStatus } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/zalopay-test', createZaloPayTest);
router.post('/callback', callback);
router.post('/check-status', checkZaloPayStatus);

export default router;
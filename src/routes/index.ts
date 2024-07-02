import jobRoutes from './jobRoutes';
import authRoutes from './authRoutes';
import accountRoutes from './accountRoutes';
import express, { Router } from 'express';
import path from 'path';

const router = Router();

router.use('/images', express.static(path.join(__dirname, '..', 'images')));
router.use('/jobs', jobRoutes)
router.use('/account', accountRoutes)
router.use('/auth', authRoutes)

export default router;
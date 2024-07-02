import { Router } from "express";
import { User, Company } from "../controllers/auth";
import upload from '../middleware/imageUploader';

const router = Router();

// The fields expected to receive (logo and logoBackground)
const uploadFields = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'logoBackground', maxCount: 1 }
  ]);

console.log('Inside authRoutes.ts');

const userControllers = new User();
const companyControllers = new Company();

router.post('/user', userControllers.postUser);
router.post('/user/login', userControllers.postLoginUser);
router.post('/company', uploadFields, companyControllers.postCompany);
router.post('/company/login', companyControllers.postLoginCompany);
router.get('/token', companyControllers.accessToken);

export default router;
import { Router } from "express";
import { Account } from '../controllers/account'
import { isAuth } from '../middleware/isAuth'

const router = Router();

const accountControllers = new Account();

router.get('/', isAuth, accountControllers.getAccountInfo);

export default router;
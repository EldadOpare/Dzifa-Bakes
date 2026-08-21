import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import bakeryRouter from "./bakery.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bakeryRouter);

export default router;

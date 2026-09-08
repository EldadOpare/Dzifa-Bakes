import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import bakeryRouter from "./bakery.js";
import uploadsRouter from "./uploads.js";
import portfolioRouter from "./portfolio.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bakeryRouter);
router.use(uploadsRouter);
router.use(portfolioRouter);

export default router;

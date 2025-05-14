import { Router } from "express";
import authRoutes from "./auth";
import verifyRoutes from "./verify";

const router = Router();

const API_PREFIX = "/api";

router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/verify`, verifyRoutes);

export default router;

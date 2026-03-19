import express from 'express';

import { getDashboardOverview, downloadDashboardExcel } from '../controllers/dashboardController.js';
import authMiddleware from '../middleware/auth.js';

const dashboardRouter = express.Router();

dashboardRouter.get("/", authMiddleware, getDashboardOverview);
dashboardRouter.get("/download", authMiddleware, downloadDashboardExcel);

export default dashboardRouter;
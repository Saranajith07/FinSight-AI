import express from "express";
import { addGoal, deleteGoal, getGoals, updateGoalProgress } from "../controllers/goalController.js";
import authMiddleware from "../middleware/auth.js";

const goalRouter = express.Router();

goalRouter.get("/", authMiddleware, getGoals);
goalRouter.post("/add", authMiddleware, addGoal);
goalRouter.put("/update/:id", authMiddleware, updateGoalProgress);
goalRouter.delete("/delete/:id", authMiddleware, deleteGoal);

export default goalRouter;

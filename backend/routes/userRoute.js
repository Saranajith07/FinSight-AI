import express from 'express';
import { deleteNotification, getCurrentUser, loginUser, markNotificationsRead, registerUser, updatePassword, updateProfile, updateSettings } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// protected Routes
userRouter.get("/me", authMiddleware, getCurrentUser);
userRouter.put("/profile", authMiddleware, updateProfile);
userRouter.put("/password", authMiddleware, updatePassword);
userRouter.put("/settings", authMiddleware, updateSettings);
userRouter.put("/notifications/read", authMiddleware, markNotificationsRead);
userRouter.delete("/notifications/:id", authMiddleware, deleteNotification);

export default userRouter;
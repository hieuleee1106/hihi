import express from "express";
import { handleChat } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", handleChat); // Tạm thời không cần protect, ai cũng có thể chat

export default router;
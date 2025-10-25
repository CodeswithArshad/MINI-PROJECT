import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import {
  createExam,
  DeleteExamById,
  getExams,
} from "../controllers/examController.js";
import {
  createQuestion,
  getQuestionsByExamId,
} from "../controllers/quesController.js";
import {
  getCheatingLogsByExamId,
  saveCheatingLog,
} from "../controllers/cheatingLogController.js";
const examRoutes = express.Router();

// protecting Exam route using auth middleware
examRoutes.route("/").get(protect, getExams).post(protect, createExam);
examRoutes.route("/questions").post(protect, createQuestion);
examRoutes.route("/questions/:examId").get(protect, getQuestionsByExamId);
// Cheating logs routes
examRoutes.get("/cheatingLogs/:examId", protect, getCheatingLogsByExamId);
examRoutes.post("/cheatingLogs", protect, saveCheatingLog);
examRoutes.route("/:examId").post(protect, DeleteExamById);

export default examRoutes;

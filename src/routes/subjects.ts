import express from "express";
import { getAllSubjects } from "../controllers/subject.controller";

const subjectRouter = express.Router();

// Get all subjects with optional search query, pagination
subjectRouter.get("/", getAllSubjects);

export default subjectRouter;

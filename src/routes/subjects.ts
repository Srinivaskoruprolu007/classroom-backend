import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express, { Request, Response } from "express";
import { subjects, departments } from "../db/schema";
import { db } from "../db/index";

const subjectRouter = express.Router();

// Get all subjects with optional search query, pagination
subjectRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;
    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);

    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];
    // if search query is provided, filter subjects by name or code using case-insensitive like operator
    if (search) {
      filterConditions.push(
        or(
          ilike(subjects.name, `%${search}%`),
          ilike(subjects.code, `%${search}%`),
        ),
      );
    }
    if (department) {
      filterConditions.push(ilike(departments.name, `%${department}%`));
    }
    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause);
    const totalCount = countResult[0]?.count || 0;

    const subjectResult = await db
      .select({
        ...getTableColumns(subjects),
        department: { ...getTableColumns(departments) },
      })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause)
      .orderBy(desc(subjects.created_At))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: subjectResult,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: "failed to fetch subjects" });
  }
});

export default subjectRouter;

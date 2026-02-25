import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import { Request, Response } from "express";
import { subjects, departments } from "../db/schema";
import { db } from "../db/index";
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const { search, department, page, limit } = req.query;
    const currentPage = Math.max(1, parseInt(String(page ?? "1"), 10));
    const limitPerPage = Math.max(1, parseInt(String(limit ?? "10"), 10));

    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];
    // if search query is provided, filter subjects by name or code using case-insensitive like operator
    const searchStr = String(search ?? "").trim();
    const departmentStr = String(department ?? "").trim();

    if (searchStr) {
      filterConditions.push(
        or(
          ilike(subjects.name, `%${searchStr}%`),
          ilike(subjects.code, `%${searchStr}%`),
        ),
      );
    }
    if (departmentStr) {
      filterConditions.push(ilike(departments.name, `%${departmentStr}%`));
    }
    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: count() })
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
};

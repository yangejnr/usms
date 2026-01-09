import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireRole } from "@/lib/authorization";

const parseScore = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

const calculateTotal = (scores: number[]) =>
  scores.reduce((sum, score) => sum + score, 0);

const normalizeTerm = (value: string) => {
  const trimmed = value.trim();
  switch (trimmed.toLowerCase()) {
    case "first term":
      return "1st";
    case "second term":
      return "2nd";
    case "third term":
      return "3rd";
    default:
      return trimmed;
  }
};


export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["teacher"]);
    if (roleCheck) {
      return roleCheck;
    }

    const body = await request.json();
    const studentId = String(body?.student_id ?? "").trim();
    const classId = String(body?.class_id ?? "").trim();
    const subjectId = String(body?.subject_id ?? "").trim();
    const schoolSession = String(body?.school_session ?? "").trim();
    const schoolTerm = String(body?.school_term ?? "").trim();
    const normalizedTerm = normalizeTerm(schoolTerm);

    const assess1 = parseScore(body?.assess_1);
    const assess2 = parseScore(body?.assess_2);
    const test1 = parseScore(body?.test_1);
    const test2 = parseScore(body?.test_2);
    const exam = parseScore(body?.exam);

    if (
      !studentId ||
      !classId ||
      !subjectId ||
      !schoolSession ||
      !schoolTerm
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Student, class, subject, session, and term are required.",
        },
        { status: 400 }
      );
    }
    if (
      assess1 === null ||
      assess2 === null ||
      test1 === null ||
      test2 === null ||
      exam === null
    ) {
      return NextResponse.json(
        { ok: false, message: "All scores must be valid numbers." },
        { status: 400 }
      );
    }

    const teacherCheck = await pool.query(
      `SELECT 1
       FROM teacher_class_subjects
       WHERE user_id = $1
         AND class_id = $2
         AND subject_id = $3
         AND status = 'active'
         AND school_session = $4
       LIMIT 1`,
      [user.id, classId, subjectId, schoolSession]
    );
    if (!teacherCheck.rows.length) {
      return NextResponse.json(
        { ok: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    const studentCheck = await pool.query(
      `SELECT 1
       FROM student_class_subjects
       WHERE student_id = $1
         AND class_id = $2
         AND subject_id = $3
         AND status = 'active'
         AND school_session = $4
       LIMIT 1`,
      [studentId, classId, subjectId, schoolSession]
    );
    if (!studentCheck.rows.length) {
      return NextResponse.json(
        { ok: false, message: "Student subject not found." },
        { status: 404 }
      );
    }


    const total = calculateTotal([assess1, assess2, test1, test2, exam]);

    const existingResult = await pool.query(
      `SELECT id
       FROM student_scores
       WHERE student_id = $1
         AND class_id = $2
         AND subject_id = $3
         AND (school_session = $4 OR session_year = $4)
         AND (school_term = $5 OR term = $6)
       ORDER BY date_added DESC
       LIMIT 1`,
      [studentId, classId, subjectId, schoolSession, schoolTerm, normalizedTerm]
    );

    if (existingResult.rows.length) {
      const existingId = existingResult.rows[0]?.id;
      await pool.query(
        `UPDATE student_scores
         SET session_year = $2,
             school_session = $2,
             school_term = $3,
             term = $4,
             first_assessment = $5,
             second_assessment = $6,
             first_test = $7,
             second_test = $8,
             exam = $9,
             total = $10,
             status = 'active',
             updated_by = $11,
             date_updated = NOW()
         WHERE id = $1`,
        [
          existingId,
          schoolSession,
          schoolTerm,
          normalizedTerm,
          assess1,
          assess2,
          test1,
          test2,
          exam,
          total,
          user.id,
        ]
      );

      return NextResponse.json({ ok: true, score_id: existingId });
    }

    const result = await pool.query(
      `INSERT INTO student_scores
       (student_id, class_id, subject_id, session_year, school_session, school_term, term,
        first_assessment, second_assessment, first_test, second_test, exam, total,
        status, added_by, date_added)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, NOW())
       RETURNING id`,
      [
        studentId,
        classId,
        subjectId,
        schoolSession,
        schoolTerm,
        normalizedTerm,
        assess1,
        assess2,
        test1,
        test2,
        exam,
        total,
        user.id,
      ]
    );

    return NextResponse.json({ ok: true, score_id: result.rows[0]?.id ?? null });
  } catch (error) {
    console.error("Save score failed:", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to save score.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["teacher"]);
    if (roleCheck) {
      return roleCheck;
    }

    const body = await request.json();
    const scoreId = String(body?.score_id ?? "").trim();
    const assess1 = parseScore(body?.assess_1);
    const assess2 = parseScore(body?.assess_2);
    const test1 = parseScore(body?.test_1);
    const test2 = parseScore(body?.test_2);
    const exam = parseScore(body?.exam);

    if (!scoreId) {
      return NextResponse.json(
        { ok: false, message: "Score id is required." },
        { status: 400 }
      );
    }
    if (
      assess1 === null ||
      assess2 === null ||
      test1 === null ||
      test2 === null ||
      exam === null
    ) {
      return NextResponse.json(
        { ok: false, message: "All scores must be valid numbers." },
        { status: 400 }
      );
    }

    const total = calculateTotal([assess1, assess2, test1, test2, exam]);

    const result = await pool.query(
      `UPDATE student_scores
       SET first_assessment = $2,
           second_assessment = $3,
           first_test = $4,
           second_test = $5,
           exam = $6,
           total = $7,
           updated_by = $8,
           date_updated = NOW()
       WHERE id = $1
       RETURNING id`,
      [scoreId, assess1, assess2, test1, test2, exam, total, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Score not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update score failed:", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to update score.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["teacher"]);
    if (roleCheck) {
      return roleCheck;
    }

    const body = await request.json();
    const scoreId = String(body?.score_id ?? "").trim();

    if (!scoreId) {
      return NextResponse.json(
        { ok: false, message: "Score id is required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE student_scores
       SET status = 'inactive',
           updated_by = $2,
           date_updated = NOW()
       WHERE id = $1`,
      [scoreId, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Score not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Remove score failed:", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to remove score.",
      },
      { status: 500 }
    );
  }
}

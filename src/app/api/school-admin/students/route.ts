import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireSchoolAdmin } from "@/lib/authorization";

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const adminCheck = await requireSchoolAdmin(user.id);
    if (adminCheck) {
      return adminCheck;
    }

    const adminResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const school = adminResult.rows[0]?.school;

    if (!school) {
      return NextResponse.json(
        { ok: false, message: "School not found for this user." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id, student_no, surname, firstname, othername, gender, dob, blood_group, phone,
              passport_photograph, email, address, parent_name, parent_phone, parent_email, parent_address, status
       FROM students
       WHERE school = $1
       ORDER BY surname ASC, firstname ASC`,
      [school]
    );

    return NextResponse.json({ ok: true, students: rows, school });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch students." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const adminCheck = await requireSchoolAdmin(user.id);
    if (adminCheck) {
      return adminCheck;
    }

    const body = await request.json();
    const studentNo = String(body?.student_no ?? "").trim();
    const surname = String(body?.surname ?? "").trim();
    const firstname = String(body?.firstname ?? "").trim();
    const othername = String(body?.othername ?? "").trim();
    const dob = String(body?.dob ?? "").trim();
    const gender = String(body?.gender ?? "").trim();
    const bloodGroup = String(body?.blood_group ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const passport = String(body?.passport_photograph ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const address = String(body?.address ?? "").trim();
    const parentName = String(body?.parent_name ?? "").trim();
    const parentPhone = String(body?.parent_phone ?? "").trim();
    const parentEmail = String(body?.parent_email ?? "").trim().toLowerCase();
    const parentAddress = String(body?.parent_address ?? "").trim();

    if (
      !studentNo ||
      !surname ||
      !firstname ||
      !gender ||
      !parentName ||
      !parentPhone
    ) {
      return NextResponse.json(
        { ok: false, message: "Required fields are missing." },
        { status: 400 }
      );
    }

    const adminResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const school = adminResult.rows[0]?.school;

    if (!school) {
      return NextResponse.json(
        { ok: false, message: "School not found for this user." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO students (
        student_no,
        surname,
        firstname,
        othername,
        dob,
        gender,
        blood_group,
        phone,
        passport_photograph,
        email,
        address,
        parent_name,
        parent_phone,
        parent_email,
        parent_address,
        school,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'active')
      RETURNING id`,
      [
        studentNo,
        surname,
        firstname,
        othername || null,
        dob || null,
        gender,
        bloodGroup || null,
        phone || null,
        passport || null,
        email || null,
        address || null,
        parentName,
        parentPhone,
        parentEmail || null,
        parentAddress || null,
        school,
      ]
    );

    return NextResponse.json({
      ok: true,
      message: "Student created.",
      student: {
        id: rows[0]?.id ?? null,
        student_no: studentNo,
        surname,
        firstname,
        othername: othername || null,
        gender,
        school,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to create student." },
      { status: 500 }
    );
  }
}

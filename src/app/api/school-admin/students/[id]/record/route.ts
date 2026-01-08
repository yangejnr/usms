import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Student id is required." },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: Array<string | null> = [];
    let index = 1;

    const maybe = (key: string, value: string | null) => {
      if (value !== null && value !== undefined) {
        fields.push(`${key} = $${index++}`);
        values.push(value);
      }
    };

    maybe("student_no", body?.student_no?.trim() ?? null);
    maybe("surname", body?.surname?.trim() ?? null);
    maybe("firstname", body?.firstname?.trim() ?? null);
    maybe("othername", body?.othername?.trim() ?? null);
    maybe("dob", body?.dob?.trim() ?? null);
    maybe("gender", body?.gender?.trim() ?? null);
    maybe("blood_group", body?.blood_group?.trim() ?? null);
    maybe("phone", body?.phone?.trim() ?? null);
    maybe("passport_photograph", body?.passport_photograph?.trim() ?? null);
    maybe("email", body?.email?.trim()?.toLowerCase() ?? null);
    maybe("address", body?.address?.trim() ?? null);
    maybe("parent_name", body?.parent_name?.trim() ?? null);
    maybe("parent_phone", body?.parent_phone?.trim() ?? null);
    maybe("parent_email", body?.parent_email?.trim()?.toLowerCase() ?? null);
    maybe("parent_address", body?.parent_address?.trim() ?? null);

    if (fields.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No fields provided to update." },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE students SET ${fields.join(", ")} WHERE id = $${index}`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Student not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Student updated." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to update student." },
      { status: 500 }
    );
  }
}

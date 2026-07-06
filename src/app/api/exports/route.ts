import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ensureSameOrigin, getJsonBody } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportService } from "@/lib/services/export-service";
import { taskListSchema } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exports = await exportService.listForUser(session.user.id);
  return NextResponse.json({ exports });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfError = ensureSameOrigin(req);
  if (csrfError) return csrfError;

  const body = await getJsonBody(req);
  const parsed = taskListSchema.safeParse(body);
  if (!parsed.success || parsed.data.rows.length === 0) {
    const message = parsed.success ? "No valid tasks to export" : parsed.error.errors[0]?.message ?? "Invalid task list";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const record = await exportService.create(session.user.id, parsed.data.rows, {
    name: user.name,
    department: user.department,
    subDepartment: user.subDepartment,
  });

  return NextResponse.json(
    { id: record.id, filename: record.filename, taskCount: record.taskCount, csvData: record.csvData },
    { status: 201 }
  );
}

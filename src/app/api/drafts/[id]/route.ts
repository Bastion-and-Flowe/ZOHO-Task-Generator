import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ensureSameOrigin, getJsonBody } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { draftService } from "@/lib/services/draft-service";
import { draftTaskListSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await draftService.getWithTasks(session.user.id, id);
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  return NextResponse.json({ draft });
}

export async function PUT(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfError = ensureSameOrigin(req);
  if (csrfError) return csrfError;

  const body = await getJsonBody(req);
  const parsed = draftTaskListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task list" }, { status: 400 });
  }
  const { id } = await params;
  const title = parsed.data.title?.trim() || "Untitled Task List";
  const rows = parsed.data.rows.filter((row) => row.taskName.trim() || row.dueDate.trim());

  try {
    const draft = await draftService.replaceTasks(session.user.id, id, title, rows);
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfError = ensureSameOrigin(req);
  if (csrfError) return csrfError;

  const { id } = await params;
  try {
    await draftService.remove(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
}

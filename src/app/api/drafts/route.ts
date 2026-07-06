import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ensureSameOrigin, getJsonBody } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { draftService } from "@/lib/services/draft-service";
import { draftTaskListSchema } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const drafts = await draftService.listForUser(session.user.id);
  return NextResponse.json({ drafts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfError = ensureSameOrigin(req);
  if (csrfError) return csrfError;

  const body = await getJsonBody(req);
  const parsed = draftTaskListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task list" }, { status: 400 });
  }

  const title = parsed.data.title?.trim() || "Untitled Task List";
  const rows = parsed.data.rows.filter((row) => row.taskName.trim() || row.dueDate.trim());

  const draft = await draftService.create(session.user.id, title, rows);
  return NextResponse.json({ draft }, { status: 201 });
}

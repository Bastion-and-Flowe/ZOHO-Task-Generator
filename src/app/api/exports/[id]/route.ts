import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ensureSameOrigin } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { exportService } from "@/lib/services/export-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfError = ensureSameOrigin(req);
  if (csrfError) return csrfError;

  const { id } = await params;
  try {
    await exportService.remove(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  // POST is used here to duplicate an existing export record.
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfError = ensureSameOrigin(req);
  if (csrfError) return csrfError;

  const { id } = await params;
  try {
    const record = await exportService.duplicate(session.user.id, id);
    return NextResponse.json({ id: record.id, filename: record.filename, taskCount: record.taskCount });
  } catch {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }
}

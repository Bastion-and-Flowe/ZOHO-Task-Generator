"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { differenceInCalendarDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskTable, newRow } from "@/components/task-table";
import { CsvPreviewDialog } from "@/components/csv-preview-dialog";
import { toast } from "@/components/ui/use-toast";
import type { TaskRow } from "@/types";
import { FileDown, Save, Trash2 } from "lucide-react";

interface DraftTaskApiRow {
  id: string;
  taskName: string | null;
  dueDate: string | null;
}

interface DraftApiResponse {
  draft: {
    id: string;
    title: string;
    tasks: DraftTaskApiRow[];
  };
}

export default function NewTaskListPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftIdParam = searchParams.get("draft");

  const [draftId, setDraftId] = useState<string | null>(draftIdParam);
  const [title, setTitle] = useState("Untitled Task List");
  const [rows, setRows] = useState<TaskRow[]>([newRow(), newRow(), newRow()]);
  const [errors, setErrors] = useState<Record<string, { taskName?: string; dueDate?: string }>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftIdParam));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const lastSavedSnapshot = useRef<string>("");

  // Load an existing draft when arriving via "Continue" from the dashboard.
  useEffect(() => {
    if (!draftIdParam) return;
    (async () => {
      setLoadingDraft(true);
      try {
        const res = await fetch(`/api/drafts/${draftIdParam}`);
        if (!res.ok) {
          toast({ title: "Could not load draft", variant: "destructive" });
          return;
        }

        const { draft }: DraftApiResponse = await res.json();
        setTitle(draft.title);
        setRows(
          draft.tasks.length
            ? draft.tasks.map((task) => ({
                id: task.id,
                taskName: task.taskName ?? "",
                dueDate: task.dueDate?.slice(0, 10) ?? "",
              }))
            : [newRow()]
        );
        setDraftId(draft.id);
      } finally {
        setLoadingDraft(false);
      }
    })();
  }, [draftIdParam]);

  const enteredRows = rows.filter((row) => row.taskName.trim() || row.dueDate.trim());
  const exportableRows = enteredRows.filter((row) => row.taskName.trim() && row.dueDate.trim());

  const validate = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextErrors: Record<string, { taskName?: string; dueDate?: string }> = {};

    for (const row of enteredRows) {
      const rowErr: { taskName?: string; dueDate?: string } = {};
      if (!row.taskName.trim()) rowErr.taskName = "Required";
      else if (row.taskName.length > 250) rowErr.taskName = "Maximum 250 characters";

      if (!row.dueDate.trim()) rowErr.dueDate = "Required";
      else if (differenceInCalendarDays(new Date(row.dueDate), today) < 0) {
        rowErr.dueDate = "Due date cannot be before today";
      }

      if (Object.keys(rowErr).length) nextErrors[row.id] = rowErr;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 && exportableRows.length > 0;
  }, [enteredRows, exportableRows]);

  const saveDraft = useCallback(
    async (silent = false) => {
      const snapshot = JSON.stringify({ title, rows: enteredRows });
      if (silent && snapshot === lastSavedSnapshot.current) return;

      if (!silent) setSaving(true);
      try {
        const payload = { title, rows: enteredRows };
        const res = await fetch(draftId ? `/api/drafts/${draftId}` : "/api/drafts", {
          method: draftId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setDraftId(data.draft.id);
          lastSavedSnapshot.current = snapshot;
          if (!silent) toast({ title: "Draft saved", variant: "success" });
        } else if (!silent) {
          const data = await res.json().catch(() => ({ error: "Could not save draft" }));
          toast({ title: "Could not save draft", description: data.error, variant: "destructive" });
        }
      } finally {
        if (!silent) setSaving(false);
      }
    },
    [draftId, title, enteredRows]
  );

  // Auto-save every 10 seconds so nothing is lost mid-meeting.
  useEffect(() => {
    const interval = setInterval(() => saveDraft(true), 10000);
    return () => clearInterval(interval);
  }, [saveDraft]);

  const handleGenerateClick = () => {
    if (!validate()) {
      toast({ title: "Fix the highlighted rows before continuing", variant: "destructive" });
      return;
    }
    setPreviewOpen(true);
  };

  const handleConfirmGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: exportableRows }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Export failed", description: data.error, variant: "destructive" });
        return;
      }

      const blob = new Blob([`\uFEFF${data.csvData}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: "CSV downloaded", description: data.filename, variant: "success" });
      setPreviewOpen(false);
      router.push("/dashboard/exports");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!draftId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Could not delete draft" }));
        toast({ title: "Could not delete draft", description: data.error, variant: "destructive" });
        return;
      }

      toast({ title: "Draft deleted", variant: "success" });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  if (!session) return null;
  if (loadingDraft) {
    return <p className="py-8 text-sm text-muted-foreground">Loading draft…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-auto border-none bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          />
          <p className="text-sm text-muted-foreground">
            Type a task name, press Enter, and keep going. Owner, department, and status are filled in automatically.
          </p>
        </div>
        <div className="flex gap-2">
          {draftId && (
            <Button variant="ghost" onClick={handleDeleteDraft} disabled={deleting}>
              <Trash2 className="mr-1.5 h-4 w-4" /> {deleting ? "Deleting…" : "Delete Draft"}
            </Button>
          )}
          <Button variant="outline" onClick={() => saveDraft(false)} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save Draft"}
          </Button>
          <Button onClick={handleGenerateClick}>
            <FileDown className="mr-1.5 h-4 w-4" /> Generate CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Only Task Name and Due Date are required — everything else is automatic.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskTable rows={rows} onChange={setRows} errors={errors} />
        </CardContent>
      </Card>

      {session.user && (
        <CsvPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          rows={exportableRows}
          user={session.user}
          onConfirm={handleConfirmGenerate}
          loading={generating}
        />
      )}
    </div>
  );
}

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/utils";
import type { TaskRow, SessionUserProfile } from "@/types";

interface CsvPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: TaskRow[];
  user: SessionUserProfile;
  onConfirm: () => void;
  loading?: boolean;
}

export function CsvPreviewDialog({ open, onOpenChange, rows, user, onConfirm, loading }: CsvPreviewDialogProps) {
  const validRows = rows.filter((r) => r.taskName.trim() && r.dueDate.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{validRows.length} Tasks Ready</DialogTitle>
          <DialogDescription>Review the summary below before generating your Zoho Projects CSV.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-3">
          <SummaryItem label="Owner" value={user.name} />
          <SummaryItem label="Department" value={user.department} />
          <SummaryItem label="Sub-Department" value={user.subDepartment} />
          <SummaryItem label="Project Type" value="Internal" />
          <SummaryItem label="Status" value="Open" />
          <SummaryItem label="Priority" value="Medium" />
        </div>

        <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Task Name</th>
                <th className="px-3 py-2">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {validRows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">{r.taskName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDisplayDate(r.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back to editing
          </Button>
          <Button onClick={onConfirm} disabled={loading || validRows.length === 0}>
            {loading ? "Generating…" : "Generate & Download CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

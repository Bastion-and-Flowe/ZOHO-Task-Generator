"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { formatDisplayDate } from "@/lib/utils";
import { Download, Copy, Trash2, ArrowUpDown, Search } from "lucide-react";
import type { ExportSummary } from "@/types";

type SortKey = "date" | "count" | "name";

export default function PreviousExportsPage() {
  const [exports, setExports] = useState<ExportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const deferredQuery = useDeferredValue(query);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/exports");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load exports");
        setExports([]);
        return;
      }
      setExports(data.exports ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = exports.filter((e) => e.filename.toLowerCase().includes(deferredQuery.toLowerCase()));
    list = [...list].sort((a, b) => {
      if (sortKey === "count") return b.taskCount - a.taskCount;
      if (sortKey === "name") return a.filename.localeCompare(b.filename);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [deferredQuery, exports, sortKey]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/exports/${id}`, { method: "DELETE" });
    if (res.ok) {
      setExports((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Export deleted" });
    } else {
      toast({ title: "Could not delete export", variant: "destructive" });
    }
  };

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`/api/exports/${id}`, { method: "POST" });
    if (res.ok) {
      toast({ title: "Export duplicated", variant: "success" });
      load();
    } else {
      toast({ title: "Could not duplicate export", variant: "destructive" });
    }
  };

  const cycleSort = () => {
    setSortKey((prev) => (prev === "date" ? "count" : prev === "count" ? "name" : "date"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Previous Exports</h1>
        <p className="mt-1 text-muted-foreground">Download, duplicate, or clean up past Zoho CSV exports.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>All Exports</CardTitle>
            <CardDescription>{filtered.length} of {exports.length} shown</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search filename…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-56 pl-8"
              />
            </div>
            <Button variant="outline" size="sm" onClick={cycleSort}>
              <ArrowUpDown className="mr-1.5 h-4 w-4" /> Sort: {sortKey === "date" ? "Newest" : sortKey === "count" ? "Task count" : "Name"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : loadError ? (
            <p className="py-8 text-center text-sm text-destructive">{loadError}</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No exports match your search.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((e) => (
                <li key={e.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.taskCount} tasks · Created {formatDisplayDate(e.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/exports/${e.id}/download`}>
                        <Download className="mr-1.5 h-4 w-4" /> Download
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Duplicate ${e.filename}`} onClick={() => handleDuplicate(e.id)}>
                      <Copy className="mr-1.5 h-4 w-4" /> Duplicate
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Delete ${e.filename}`} onClick={() => handleDelete(e.id)}>
                      <Trash2 className="mr-1.5 h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

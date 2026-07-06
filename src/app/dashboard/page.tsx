import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { draftService } from "@/lib/services/draft-service";
import { exportService } from "@/lib/services/export-service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/utils";
import { ListPlus, History, UserCog, FileSpreadsheet } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [drafts, exports] = await Promise.all([
    draftService.listForUser(userId),
    exportService.listForUser(userId),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {session.user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-muted-foreground">
          Capture meeting action items and generate a Zoho Projects CSV in under two minutes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/dashboard/new" icon={<ListPlus className="h-5 w-5" />} label="New Task List" primary />
        <QuickAction href="/dashboard/exports" icon={<History className="h-5 w-5" />} label="Previous Exports" />
        <QuickAction href="/dashboard/profile" icon={<UserCog className="h-5 w-5" />} label="Profile" />
        <QuickAction href="/dashboard/exports" icon={<FileSpreadsheet className="h-5 w-5" />} label="Latest Export" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saved Drafts</CardTitle>
            <CardDescription>Pick up a task list you started earlier.</CardDescription>
          </CardHeader>
          <CardContent>
            {drafts.length === 0 ? (
              <EmptyState label="No drafts yet. Start a new task list to save one." />
            ) : (
              <ul className="divide-y divide-border">
                {drafts.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.taskCount} tasks · updated {formatDisplayDate(d.updatedAt)}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/new?draft=${d.id}`}>Continue</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Exports</CardTitle>
            <CardDescription>Your most recently generated Zoho CSV files.</CardDescription>
          </CardHeader>
          <CardContent>
            {exports.length === 0 ? (
              <EmptyState label="No exports yet. Generate your first CSV from a new task list." />
            ) : (
              <ul className="divide-y divide-border">
                {exports.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{e.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.taskCount} tasks · {formatDisplayDate(e.createdAt)}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/exports/${e.id}/download`}>Download</a>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl border border-border p-4 shadow-soft transition-colors hover:bg-accent ${
        primary ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-card"
      }`}
    >
      <span className={primary ? "text-primary-foreground" : "text-primary"}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{label}</p>;
}

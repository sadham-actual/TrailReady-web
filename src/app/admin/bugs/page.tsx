import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Bug, MapPin, LayoutDashboard, Zap, HelpCircle, Database } from 'lucide-react';
import { createSupabaseServerActionClient, createSupabaseServiceClient } from '@/lib/supabase/server';

interface BugReport {
  id: string;
  category: string;
  description: string;
  page_url: string | null;
  user_id: string | null;
  created_at: string;
}

const CATEGORY_ICONS: Record<string, ReactNode> = {
  map: <MapPin className="h-3.5 w-3.5" />,
  data: <Database className="h-3.5 w-3.5" />,
  ui: <LayoutDashboard className="h-3.5 w-3.5" />,
  performance: <Zap className="h-3.5 w-3.5" />,
  other: <HelpCircle className="h-3.5 w-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  map: 'bg-blue-100 text-blue-800 border-blue-200',
  data: 'bg-purple-100 text-purple-800 border-purple-200',
  ui: 'bg-amber-100 text-amber-800 border-amber-200',
  performance: 'bg-red-100 text-red-800 border-red-200',
  other: 'bg-stone-100 text-stone-700 border-stone-200',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function AdminBugsPage() {
  const authClient = await createSupabaseServerActionClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect('/auth/login');

  const supabase = createSupabaseServiceClient();
  const { data: reports, error } = await supabase
    .from('bug_reports')
    .select('id, category, description, page_url, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center px-4">
        <p className="font-mono text-xs text-red-600 uppercase tracking-wider">Failed to load reports</p>
      </div>
    );
  }

  const bugReports = (reports ?? []) as BugReport[];

  return (
    <div className="min-h-screen bg-bone px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Bug className="h-5 w-5 text-action-orange" />
        <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-deep-stone">
          Bug Reports
        </h1>
        <span className="ml-auto font-mono text-xs text-muted-stone">
          {bugReports.length} total
        </span>
      </div>

      {bugReports.length === 0 ? (
        <div className="border border-stone-border bg-white p-8 text-center">
          <Bug className="h-8 w-8 text-stone-300 mx-auto mb-2" />
          <p className="font-mono text-xs text-muted-stone uppercase tracking-wider">No reports yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bugReports.map((report) => (
            <div key={report.id} className="border border-stone-border bg-white p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 border font-mono text-xs font-semibold uppercase tracking-wider ${CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS.other}`}
                >
                  {CATEGORY_ICONS[report.category] ?? CATEGORY_ICONS.other}
                  {report.category}
                </span>
                <span className="font-mono text-xs text-muted-stone whitespace-nowrap">
                  {timeAgo(report.created_at)}
                </span>
              </div>

              <p className="font-mono text-xs text-deep-stone leading-relaxed mb-2">
                {report.description}
              </p>

              {report.page_url && (
                <p className="font-mono text-xs text-muted-stone truncate">
                  {report.page_url}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

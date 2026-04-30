'use server';

import { createSupabaseServiceClient, createSupabaseServerActionClient } from '@/lib/supabase/server';

export type BugReportCategory = 'map' | 'data' | 'ui' | 'performance' | 'other';

export interface BugReportInput {
  category: BugReportCategory;
  description: string;
  pageUrl?: string;
}

export interface BugReportState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

export async function submitBugReport(input: BugReportInput): Promise<BugReportState> {
  const { category, description, pageUrl } = input;

  const validCategories: BugReportCategory[] = ['map', 'data', 'ui', 'performance', 'other'];
  if (!validCategories.includes(category)) {
    return { status: 'error', message: 'INVALID CATEGORY' };
  }
  if (!description || typeof description !== 'string') {
    return { status: 'error', message: 'DESCRIPTION REQUIRED' };
  }
  if (description.length > 1000) {
    return { status: 'error', message: 'DESCRIPTION EXCEEDS 1000 CHARACTER LIMIT' };
  }

  const authClient = await createSupabaseServerActionClient();
  const { data: { user } } = await authClient.auth.getUser();

  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('bug_reports').insert({
      id: crypto.randomUUID(),
      category,
      description: description.trim(),
      page_url: pageUrl ?? null,
      user_id: user?.id ?? null,
    });

    if (error) throw error;

    return { status: 'success', message: 'REPORT RECEIVED — THANK YOU' };
  } catch (err) {
    console.error('Bug report submission failed:', err);
    return { status: 'error', message: 'SUBMISSION FAILED — TRY AGAIN' };
  }
}

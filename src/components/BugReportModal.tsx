'use client';

import { useTransition } from 'react';
import { Bug, X, ChevronDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitBugReport, type BugReportCategory } from '@/app/bug-report/actions';
import { useState } from 'react';

const CATEGORIES: { value: BugReportCategory; label: string }[] = [
  { value: 'map', label: 'Map Issue' },
  { value: 'data', label: 'Trail Data' },
  { value: 'ui', label: 'UI / Display' },
  { value: 'performance', label: 'Performance' },
  { value: 'other', label: 'Other' },
];

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const [category, setCategory] = useState<BugReportCategory>('other');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    startTransition(async () => {
      const result = await submitBugReport({
        category,
        description,
        pageUrl: window.location.href,
      });

      if (result.status === 'success') {
        toast.success(result.message);
        setDescription('');
        setCategory('other');
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-deep-stone/40 backdrop-blur-sm z-50"
        onClick={() => onOpenChange(false)}
      />

      <div className="fixed top-20 right-4 z-50 w-[min(360px,calc(100vw-2rem))] bg-bone border border-stone-border shadow-[4px_4px_0_0_var(--color-stone-border)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-border">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-action-orange" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-deep-stone">
              Report a Bug
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-stone-light rounded-sm transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-stone" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-muted-stone mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BugReportCategory)}
                className="w-full appearance-none bg-white border border-stone-border px-3 py-2 font-mono text-xs text-deep-stone focus:outline-none focus:border-action-orange"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-stone" />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-muted-stone mb-1.5">
              What went wrong?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              maxLength={1000}
              required
              className="w-full bg-white border border-stone-border px-3 py-2 font-mono text-xs text-deep-stone placeholder:text-muted-stone/60 focus:outline-none focus:border-action-orange resize-none"
            />
            <div className="text-right font-mono text-xs text-muted-stone mt-0.5">
              {description.length}/1000
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !description.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-action-orange text-white border border-action-orange-dark font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0_var(--color-action-orange-dark)] hover:bg-action-orange-light active:shadow-[1px_1px_0_0_var(--color-action-orange-dark)] active:translate-x-px active:translate-y-px transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send className="h-3.5 w-3.5" />
            {isPending ? 'Sending...' : 'Send Report'}
          </button>
        </form>
      </div>
    </>
  );
}

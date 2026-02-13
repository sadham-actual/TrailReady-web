'use client';

import { motion } from 'framer-motion';

interface ReliabilityBadgeProps {
  score: number; // 0-100 from calculateReliabilityScore
  className?: string;
}

export function ReliabilityBadge({ score, className = '' }: ReliabilityBadgeProps) {
  // Clamp score to valid range
  const clampedScore = Math.max(0, Math.min(100, score || 0));

  // Determine color zone
  const getColorClasses = (value: number) => {
    if (value === 0) {
      return {
        container: 'border-stone-400 bg-stone-100 text-stone-600 border-dashed',
        bar: 'bg-stone-400',
        text: 'text-stone-600'
      };
    }
    if (value < 30) {
      return {
        container: 'border-rose-600 bg-rose-500/10 text-rose-600',
        bar: 'bg-rose-600',
        text: 'text-rose-600'
      };
    }
    if (value < 70) {
      return {
        container: 'border-amber-600 bg-amber-500/10 text-amber-600',
        bar: 'bg-amber-600',
        text: 'text-amber-600'
      };
    }
    return {
      container: 'border-emerald-600 bg-emerald-500/10 text-emerald-600',
      bar: 'bg-emerald-600',
      text: 'text-emerald-600'
    };
  };

  const colors = getColorClasses(clampedScore);

  return (
    <div className={`border rounded-none px-3 py-2 ${colors.container} ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`font-mono text-xs uppercase tracking-wider font-semibold ${colors.text}`}>
          Data Trust
        </span>
        <span className={`font-mono text-xs uppercase tracking-wider font-bold ${colors.text}`}>
          {clampedScore}%
        </span>
      </div>

      {/* Progress bar background */}
      <div className="relative h-2 bg-stone-200 border border-stone-800 overflow-hidden">
        {/* Animated progress bar fill */}
        <motion.div
          className={`h-full ${colors.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedScore}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default ReliabilityBadge;

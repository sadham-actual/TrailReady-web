import type { Metadata } from 'next';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const SITE_URL = 'https://trailready.sadham.org';

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Moderate',
  3: 'Difficult',
  4: 'Extreme',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: trail } = await supabase
    .from('trails')
    .select('name, region, description, base_difficulty')
    .eq('id', id)
    .single();

  if (!trail) {
    return { title: 'Trail | TrailReady' };
  }

  const difficulty = DIFFICULTY_LABELS[trail.base_difficulty ?? 0] ?? 'Unknown';
  const title = `${trail.name} — ${trail.region} | TrailReady`;
  const description = trail.description
    ? trail.description.slice(0, 155) + (trail.description.length > 155 ? '…' : '')
    : `${trail.name} trail conditions and reports. Difficulty: ${difficulty}. Know before you go.`;

  const url = `${SITE_URL}/trails/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'TrailReady',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function TrailDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

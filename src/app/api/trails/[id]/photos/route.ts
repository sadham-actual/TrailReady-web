import { NextResponse } from 'next/server';
import { getMockTrail } from '@/data/sampleTrails';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

async function trySupabasePhotos(trailId: string) {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const supabase = createSupabaseServiceClient();

    const { data: photos, error } = await supabase
      .from('photos')
      .select('id,url,created_at,vehicle_type,notes,confidence')
      .eq('trail_id', trailId)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) return null;

    return (photos ?? []).map((p) => ({
      id: p.id,
      url: p.url,
      createdAt: p.created_at,
      report: p.vehicle_type
        ? {
            vehicleType: p.vehicle_type,
            notes: p.notes,
            confidence: p.confidence,
          }
        : null,
    }));
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trailId } = await params;

    const dbPhotos = await trySupabasePhotos(trailId);
    if (dbPhotos !== null) {
      return NextResponse.json({ success: true, data: dbPhotos });
    }

    const mockTrail = getMockTrail(trailId);
    if (!mockTrail) {
      return NextResponse.json({ success: false, error: { message: 'Trail not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching trail photos:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Database query failed' } },
      { status: 500 }
    );
  }
}

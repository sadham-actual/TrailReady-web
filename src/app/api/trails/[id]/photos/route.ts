import { NextResponse } from 'next/server';
import { getMockTrail } from '@/data/sampleTrails';

async function tryPrismaPhotos(trailId: string) {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const prisma = (await import('@/lib/prisma')).default;
    const photos = await prisma.photo.findMany({
      where: { trailId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        url: true,
        createdAt: true,
        report: {
          select: { vehicleType: true, notes: true, confidence: true },
        },
      },
    });
    return photos;
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

    const dbPhotos = await tryPrismaPhotos(trailId);
    if (dbPhotos !== null) {
      return NextResponse.json({ success: true, data: dbPhotos });
    }

    // Fallback: no mock photos for now — return empty array
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

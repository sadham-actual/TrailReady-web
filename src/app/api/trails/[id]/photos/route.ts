import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trailId } = await params;

    const photos = await prisma.photo.findMany({
      where: { trailId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        url: true,
        createdAt: true,
        report: {
          select: {
            vehicleType: true,
            notes: true,
            confidence: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: photos,
    });
  } catch (error) {
    console.error('Error fetching trail photos:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Database query failed' },
      },
      { status: 500 }
    );
  }
}

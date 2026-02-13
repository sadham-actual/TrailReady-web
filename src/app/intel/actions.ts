'use server';

import prisma from '@/lib/prisma';
import { Status, Confidence, VehicleType } from '@/types';

export type ReportState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  reportId?: string;
  photoIds?: string[];
};

export interface PhotoInput {
  url: string;
  caption: string | null;
}

export interface FieldReportInput {
  trailId: string;
  status: Status;
  vehicleType: VehicleType;
  confidence: Confidence;
  notes?: string;
  photos?: PhotoInput[];
}

/**
 * Submit a complete field report for a trail
 * Creates ConditionReport and optional Photo records in a single transaction
 */
export async function submitFieldReport(input: FieldReportInput): Promise<ReportState> {
  const { trailId, status, vehicleType, confidence, notes, photos } = input;

  // Validate trail ID
  if (!trailId || typeof trailId !== 'string') {
    return {
      status: 'error',
      message: 'INVALID TRAIL IDENTIFIER',
    };
  }

  // Validate status
  if (!['clear', 'rough', 'impassable'].includes(status)) {
    return {
      status: 'error',
      message: 'INVALID STATUS VALUE',
    };
  }

  // Validate confidence
  if (!['low', 'medium', 'high'].includes(confidence)) {
    return {
      status: 'error',
      message: 'INVALID CONFIDENCE VALUE',
    };
  }

  // Validate photos if provided
  if (photos && photos.length > 5) {
    return {
      status: 'error',
      message: 'MAX 5 PHOTOS PER SUBMISSION',
    };
  }

  // Validate notes length
  if (notes && notes.length > 500) {
    return {
      status: 'error',
      message: 'NOTES EXCEED 500 CHARACTER LIMIT',
    };
  }

  try {
    // Verify trail exists
    const trail = await prisma.trail.findUnique({
      where: { id: trailId },
      select: { id: true },
    });

    if (!trail) {
      return {
        status: 'error',
        message: 'TRAIL NOT FOUND IN DATABASE',
      };
    }

    // Get or create anonymous user for now
    // In the future, this would use authenticated user ID
    let user = await prisma.user.findFirst({
      where: { isAnonymous: true },
      select: { id: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { isAnonymous: true },
        select: { id: true },
      });
    }

    // Create report and photos in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the condition report
      const report = await tx.conditionReport.create({
        data: {
          trailId,
          userId: user.id,
          status,
          confidence,
          vehicleType,
          notes: notes || null,
        },
        select: { id: true },
      });

      // Create photo records if provided
      let photoIds: string[] = [];
      if (photos && photos.length > 0) {
        // Validate URLs before storing
        const validPhotos = photos.filter((photo) => {
          try {
            const url = new URL(photo.url);

            // Ensure URL is from UploadThing CDN
            if (!url.hostname.includes('uploadthing.com') && !url.hostname.includes('utfs.io')) {
              console.warn(`Invalid photo URL host: ${url.hostname}`);
              return false;
            }

            return true;
          } catch (err) {
            console.warn(`Malformed photo URL: ${photo.url}`);
            return false;
          }
        });

        if (validPhotos.length === 0) {
          throw new Error('No valid photo URLs provided');
        }

        const createdPhotos = await Promise.all(
          validPhotos.map((photo) =>
            tx.photo.create({
              data: {
                url: photo.url,
                caption: photo.caption,
                trailId,
                reportId: report.id,
              },
              select: { id: true },
            })
          )
        );
        photoIds = createdPhotos.map((p) => p.id);
      }

      return { reportId: report.id, photoIds };
    });

    // Build success message
    const photoCount = result.photoIds.length;
    const message = photoCount > 0
      ? `CONDITION LOGGED + ${photoCount} PHOTO${photoCount > 1 ? 'S' : ''} ATTACHED`
      : 'CONDITION REPORT LOGGED';

    return {
      status: 'success',
      message,
      reportId: result.reportId,
      photoIds: result.photoIds.length > 0 ? result.photoIds : undefined,
    };
  } catch (error) {
    console.error('Field report submission failed:', error);
    return {
      status: 'error',
      message: 'DATABASE TRANSMISSION FAILED',
    };
  }
}

// Keep the old function for backwards compatibility (photo-only submissions)
export type IntelState = ReportState;

export async function submitPhotoIntel(
  trailId: string,
  photos: PhotoInput[]
): Promise<IntelState> {
  // Validate trail ID
  if (!trailId || typeof trailId !== 'string') {
    return {
      status: 'error',
      message: 'INVALID TRAIL IDENTIFIER',
    };
  }

  // Validate photos array
  if (!Array.isArray(photos) || photos.length === 0) {
    return {
      status: 'error',
      message: 'NO PHOTO INTEL PROVIDED',
    };
  }

  if (photos.length > 5) {
    return {
      status: 'error',
      message: 'MAX 5 PHOTOS PER SUBMISSION',
    };
  }

  try {
    // Verify trail exists
    const trail = await prisma.trail.findUnique({
      where: { id: trailId },
      select: { id: true },
    });

    if (!trail) {
      return {
        status: 'error',
        message: 'TRAIL NOT FOUND IN DATABASE',
      };
    }

    // Create photo records
    const createdPhotos = await prisma.$transaction(
      photos.map((photo) =>
        prisma.photo.create({
          data: {
            url: photo.url,
            caption: photo.caption,
            trailId: trailId,
          },
          select: { id: true },
        })
      )
    );

    return {
      status: 'success',
      message: `${createdPhotos.length} PHOTO${createdPhotos.length > 1 ? 'S' : ''} LOGGED`,
      photoIds: createdPhotos.map((p) => p.id),
    };
  } catch (error) {
    console.error('Photo intel submission failed:', error);
    return {
      status: 'error',
      message: 'DATABASE TRANSMISSION FAILED',
    };
  }
}

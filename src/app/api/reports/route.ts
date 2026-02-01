import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errors } from '@/lib/api/response';
import { submitReportSchema } from '@/lib/validations/report';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = submitReportSchema.parse(body);

    // Verify trail exists
    const trail = await prisma.trail.findUnique({
      where: { id: validatedData.trailId },
      select: { id: true },
    });

    if (!trail) {
      return errors.notFound('Trail');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true },
    });

    if (!user) {
      return errors.badRequest('Invalid user ID. Please create an anonymous user first.');
    }

    // Create the condition report
    const report = await prisma.conditionReport.create({
      data: {
        trailId: validatedData.trailId,
        userId: validatedData.userId,
        status: validatedData.status,
        confidence: validatedData.confidence,
        vehicleType: validatedData.vehicleType,
        notes: validatedData.notes,
      },
    });

    return successResponse(
      {
        id: report.id,
        timestamp: report.timestamp.toISOString(),
      },
      201
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return errors.validationError(
        firstError.message || 'Invalid request data'
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return errors.badRequest('Invalid JSON in request body');
    }

    console.error('Error creating report:', error);
    return errors.internalError('Failed to create report');
  }
}

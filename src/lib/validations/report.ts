import { z } from 'zod';

// Enum schemas matching domain types
export const statusSchema = z.enum(['clear', 'rough', 'impassable']);

export const confidenceSchema = z.enum(['low', 'medium', 'high']);

export const vehicleTypeSchema = z.enum([
  'stockSUV_solidAxle',
  'stockSUV_IFS',
  'stockSUV_IFRS',
  'lifted4x4_solidAxle',
  'lifted4x4_IFS',
  'lifted4x4_IFRS',
  'sideBySide',
  'dirtBike',
]);

// Submit report validation schema
export const submitReportSchema = z.object({
  trailId: z.string().cuid('Invalid trail ID format'),
  userId: z.string().cuid('Invalid user ID format'),
  status: statusSchema,
  confidence: confidenceSchema,
  vehicleType: vehicleTypeSchema,
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type SubmitReportInput = z.infer<typeof submitReportSchema>;

// Trail query validation
export const trailQuerySchema = z.object({
  search: z.string().optional(),
  region: z.string().optional(),
});

export type TrailQueryInput = z.infer<typeof trailQuerySchema>;

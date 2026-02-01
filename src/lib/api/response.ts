import { NextResponse } from 'next/server';

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    { success: true, data },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400
) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const errors = {
  notFound: (resource: string) =>
    errorResponse('NOT_FOUND', `${resource} not found`, 404),

  badRequest: (message: string) =>
    errorResponse('BAD_REQUEST', message, 400),

  validationError: (message: string) =>
    errorResponse('VALIDATION_ERROR', message, 400),

  internalError: (message = 'Internal server error') =>
    errorResponse('INTERNAL_ERROR', message, 500),

  methodNotAllowed: () =>
    errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405),
};

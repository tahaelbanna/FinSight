import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api.types';

export interface ExtractedErrors {
  fieldErrors: Record<string, string>;
  generalErrors: string[];
  status?: number;
}

/**
 * Extracts and categorizes backend errors conforming to the unified CustomExceptionFilter contract:
 * { errors: [{ field?: string, message: string }] }
 */
export function extractApiErrors(error: unknown): ExtractedErrors {
  const result: ExtractedErrors = {
    fieldErrors: {},
    generalErrors: [],
  };

  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      result.generalErrors.push(error.message);
    } else {
      result.generalErrors.push('An unexpected error occurred. Please try again.');
    }
    return result;
  }

  const axiosError = error as AxiosError<ApiErrorResponse>;
  result.status = axiosError.response?.status;

  // 1. Network / Connection Errors
  if (!axiosError.response) {
    if (axiosError.code === 'ECONNABORTED') {
      result.generalErrors.push('Request timed out. Please try again.');
    } else {
      result.generalErrors.push(
        'Unable to connect to the server. Please check your network or server status.'
      );
    }
    return result;
  }

  const data = axiosError.response.data;

  // 2. Standardized FinSight Backend Error Envelope: { errors: [...] }
  if (data && Array.isArray(data.errors) && data.errors.length > 0) {
    for (const err of data.errors) {
      if (err.field) {
        result.fieldErrors[err.field] = err.message;
      } else if (err.message) {
        result.generalErrors.push(err.message);
      }
    }
    return result;
  }

  // 3. Fallback for non-standard or raw HTTP status codes
  switch (axiosError.response.status) {
    case 401:
      result.generalErrors.push('Invalid credentials or session expired.');
      break;
    case 403:
      result.generalErrors.push('You do not have permission to perform this action.');
      break;
    case 404:
      result.generalErrors.push('Requested resource was not found.');
      break;
    case 500:
    case 502:
    case 503:
      result.generalErrors.push('Internal server error. Please try again later.');
      break;
    default:
      result.generalErrors.push(
        (data as any)?.message || `Request failed with status ${axiosError.response.status}`
      );
  }

  return result;
}

/**
 * Returns the most relevant single user-facing error message.
 */
export function getFirstErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred'
): string {
  const extracted = extractApiErrors(error);
  if (extracted.generalErrors.length > 0) {
    return extracted.generalErrors[0];
  }
  const fieldNames = Object.keys(extracted.fieldErrors);
  if (fieldNames.length > 0) {
    return extracted.fieldErrors[fieldNames[0]];
  }
  return fallback;
}

/**
 * Unified Backend Response Envelopes & Error Contracts
 * Strictly mirrors TransformResponseInterceptor and CustomExceptionFilter
 */

export interface ApiResponse<T> {
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorItem {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  errors: ApiErrorItem[];
}

/**
 * Normalizes backend paginated responses whether nested in { data: { data, meta } }
 * or standard { data, meta }.
 */
export function normalizePaginatedResponse<T>(payload: any): PaginatedResponse<T> {
  if (payload?.data && Array.isArray(payload.data.data)) {
    return {
      data: payload.data.data,
      meta: payload.data.meta || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }
  if (payload && Array.isArray(payload.data)) {
    return {
      data: payload.data,
      meta: payload.meta || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }
  if (Array.isArray(payload)) {
    return {
      data: payload,
      meta: { page: 1, limit: payload.length, total: payload.length, totalPages: 1 },
    };
  }
  return {
    data: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
  };
}

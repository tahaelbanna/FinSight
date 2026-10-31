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

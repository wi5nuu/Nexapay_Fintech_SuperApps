/**
 * Sorting order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Interface for sorting parameters
 */
export interface ISorting {
  field: string;
  order: SortOrder;
}

/**
 * Interface for pagination parameters (Request)
 */
export interface IPaginationParams {
  page: number;
  limit: number;
  sortBy?: ISorting[];
}

/**
 * Interface for pagination metadata (Response)
 */
export interface IPaginationMeta {
  itemCount: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Generic interface for paginated responses
 */
export interface IPaginatedResponse<T> {
  data: T[];
  meta: IPaginationMeta;
}

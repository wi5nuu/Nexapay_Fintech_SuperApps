import type { AxiosInstance } from 'axios';
import { success, failure, type Result } from '../../../../shared/utils/result';

/**
 * Base Repository class providing common API handling logic.
 */
export abstract class BaseRepository {
  constructor(protected readonly api: AxiosInstance) {}

  /**
   * Wrapper for API calls to return Result objects
   */
  protected async handleRequest<T>(
    request: Promise<{ data: T }>
  ): Promise<Result<T, Error>> {
    try {
      const response = await request;
      return success(response.data);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Unknown error occurred';
      return failure(new Error(message));
    }
  }
}

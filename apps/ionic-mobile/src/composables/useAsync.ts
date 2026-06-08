import { ref } from 'vue';
import type { Result } from '../../../../shared/utils/result';

interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Enterprise-grade composable for handling asynchronous operations.
 * Manages loading, error, and result states with optional hooks.
 */
export function useAsync<T>(
  asyncFn: (...args: any[]) => Promise<Result<T, Error>>,
  options: UseAsyncOptions<T> = {}
) {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const data = ref<T | null>(null);

  const execute = async (...args: any[]) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await asyncFn(...args);
      
      if (result.isSuccess()) {
        data.value = result.value;
        options.onSuccess?.(result.value);
        return result.value;
      } else {
        error.value = result.error;
        options.onError?.(result.error);
        return null;
      }
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error('An unexpected error occurred');
      error.value = err;
      options.onError?.(err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  if (options.immediate) {
    execute();
  }

  return {
    loading,
    error,
    data,
    execute,
  };
}

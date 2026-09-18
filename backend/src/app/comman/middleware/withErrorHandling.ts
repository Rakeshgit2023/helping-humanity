import ApiError from "../utils/api.error.js";

export function withErrorHandling<Args extends unknown[], Result>(
  label: string,
  fn: (...args: Args) => Promise<Result>,
) {
  return async (...args: Args): Promise<Result> => {
    try {
      return await fn(...args);
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error(`${label} Error:`, error);
      throw ApiError.internal(
        error?.cause?.detail ||
          `Unable to complete "${label}". Please try again later.`,
      );
    }
  };
}

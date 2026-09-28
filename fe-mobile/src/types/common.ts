export type Nullable<T> = T | null;

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: Nullable<T>;
  error: Nullable<string>;
}

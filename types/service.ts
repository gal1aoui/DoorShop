export interface ServiceSuccess<T> {
  data: T;
  error: null;
}

export interface ServiceFailure {
  data: null;
  error: string;
}

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export function ok<T>(data: T): ServiceSuccess<T> {
  return { data, error: null };
}

export function fail(error: string): ServiceFailure {
  return { data: null, error };
}

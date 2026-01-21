/**
 * @acme/core - Core utilities and types
 */

// Types
export interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

// Utilities
export function createConfig(partial: Partial<Config>): Config {
  return {
    apiUrl: "https://api.acme.com",
    timeout: 5000,
    retries: 3,
    ...partial,
  };
}

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

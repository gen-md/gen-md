/**
 * Common types shared across packages
 */

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

import type { ApiResponse, User, HttpMethod } from "../../shared/types";

/**
 * API Client for Acme Platform
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch a user by ID
   */
  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request("GET", `/users/${id}`);
  }

  /**
   * Create a new user
   */
  async createUser(data: Omit<User, "id">): Promise<ApiResponse<User>> {
    return this.request("POST", "/users", data);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
  }
}

export { ApiResponse, User, HttpMethod } from "../../shared/types";

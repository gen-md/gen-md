/**
 * User API endpoints
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
}

/**
 * Get all users with optional pagination
 * @param limit - Maximum number of users to return (default: 10)
 * @param offset - Number of users to skip (default: 0)
 * @returns Array of User objects
 */
export async function getUsers(limit = 10, offset = 0): Promise<User[]> {
  // Implementation
  return [];
}

/**
 * Get a single user by ID
 * @param id - The user's unique identifier
 * @returns User object or null if not found
 */
export async function getUser(id: string): Promise<User | null> {
  // Implementation
  return null;
}

/**
 * Create a new user
 * @param input - User creation data
 * @returns The created User object
 * @throws {ValidationError} If email is invalid
 * @throws {ConflictError} If email already exists
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  // Implementation
  return {} as User;
}

/**
 * Update an existing user
 * @param id - The user's unique identifier
 * @param input - Fields to update
 * @returns The updated User object
 * @throws {NotFoundError} If user doesn't exist
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  // Implementation
  return {} as User;
}

/**
 * Delete a user
 * @param id - The user's unique identifier
 * @returns true if deleted, false if not found
 */
export async function deleteUser(id: string): Promise<boolean> {
  // Implementation
  return false;
}

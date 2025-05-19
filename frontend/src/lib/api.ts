import { ApiResponse } from "@/types/api";
import { getCurrentUser } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Fetch wrapper with authentication and error handling
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get the current user for auth token
    const user = await getCurrentUser();
    const token = user ? await user.getIdToken() : null;

    // Prepare headers
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    // Make the request
    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);

    // Parse the JSON response
    const data = await response.json();

    // Check if the response is successful
    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "An error occurred",
        errors: data.errors,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    console.error("API request failed:", error);
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * GET request wrapper
 */
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: "GET" });
}

/**
 * POST request wrapper
 */
export async function post<T>(
  endpoint: string,
  data: any
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * PUT request wrapper
 */
export async function put<T>(
  endpoint: string,
  data: any
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * PATCH request wrapper
 */
export async function patch<T>(
  endpoint: string,
  data: any
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request wrapper
 */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: "DELETE" });
}

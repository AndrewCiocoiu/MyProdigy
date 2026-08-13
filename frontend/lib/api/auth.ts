import { apiClient } from "@/lib/api/apiClient";
import { AuthResponse } from "@/types/models";

export interface RegisterParams {
  email: string;
  password: string;
  displayName?: string;
}

export async function registerUser(params: RegisterParams): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

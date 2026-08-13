import { apiClient } from "@/lib/api/apiClient";
import { Household, HouseholdInvite, HouseholdStatusResponse } from "@/types/models";

async function getAuthToken(providedToken?: string): Promise<string | undefined> {
  if (providedToken) return providedToken;
  try {
    const res = await fetch("/api/auth/token");
    if (res.ok) {
      const data = await res.json();
      return data.token || undefined;
    }
  } catch {
    // Return undefined if token fetch fails
  }
  return undefined;
}

export async function getHouseholdStatus(token?: string): Promise<HouseholdStatusResponse> {
  const authToken = await getAuthToken(token);
  return apiClient<HouseholdStatusResponse>("/api/household/status", {
    method: "GET",
    token: authToken,
  });
}

export async function generateInviteCode(token?: string): Promise<HouseholdInvite> {
  const authToken = await getAuthToken(token);
  return apiClient<HouseholdInvite>("/api/household/invite", {
    method: "POST",
    token: authToken,
  });
}

export async function joinHousehold(code: string, token?: string): Promise<Household> {
  const authToken = await getAuthToken(token);
  return apiClient<Household>("/api/household/join", {
    method: "POST",
    body: JSON.stringify({ code }),
    token: authToken,
  });
}

export async function leaveHousehold(token?: string): Promise<{ message: string }> {
  const authToken = await getAuthToken(token);
  return apiClient<{ message: string }>("/api/household/leave", {
    method: "POST",
    token: authToken,
  });
}

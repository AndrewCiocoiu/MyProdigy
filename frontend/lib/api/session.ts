import { apiClient } from "@/lib/api/apiClient";
import {
  ActiveSession,
  StartSessionRequest,
  FocusSessionHistoryResponse,
} from "@/types/models";

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

export async function getCurrentSession(token?: string): Promise<ActiveSession | null> {
  const authToken = await getAuthToken(token);
  const data = await apiClient<{ activeSession: ActiveSession | null }>("/api/session/current", {
    method: "GET",
    token: authToken,
  });
  return data.activeSession;
}

export async function startFocusSession(
  req: StartSessionRequest,
  token?: string
): Promise<ActiveSession> {
  const authToken = await getAuthToken(token);
  return apiClient<ActiveSession>("/api/session/start", {
    method: "POST",
    body: JSON.stringify(req),
    token: authToken,
  });
}

export async function joinFocusSession(token?: string): Promise<ActiveSession> {
  const authToken = await getAuthToken(token);
  return apiClient<ActiveSession>("/api/session/join", {
    method: "POST",
    token: authToken,
  });
}

export async function endFocusSession(
  token?: string
): Promise<{ message: string; session?: ActiveSession }> {
  const authToken = await getAuthToken(token);
  return apiClient<{ message: string; session?: ActiveSession }>("/api/session/end", {
    method: "POST",
    token: authToken,
  });
}

export async function getFocusSessionHistory(
  limit = 50,
  offset = 0,
  token?: string
): Promise<FocusSessionHistoryResponse> {
  const authToken = await getAuthToken(token);
  return apiClient<FocusSessionHistoryResponse>(
    `/api/session/history?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      token: authToken,
    }
  );
}

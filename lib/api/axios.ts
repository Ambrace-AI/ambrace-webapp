import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type {
  VivaStartRequest,
  VivaStartResponse,
  ConcludeVivaRequest,
  ConcludeVivaResponse,
  VivaSession,
} from "@/types/viva";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// The access token is never stored here. Each request asks the sign-in
// library for the current one, so a token that expired or was refreshed in
// another tab is never reused.
type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;

/** Registered once, when the app starts, by the sign-in provider. */
export function setTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

/** The signed-in student's current access token, or null when signed out. */
export async function getAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  return await tokenGetter();
}

// What to do when the backend no longer accepts the session. The API client
// only reports it; the app decides (it checks the session and, if it really
// has ended, returns the student to sign-in).
type UnauthorizedHandler = (path: string | undefined) => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  unauthorizedHandler = handler;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Failed to get auth token:", error);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401)
      unauthorizedHandler?.(error.config?.url);
    return Promise.reject(error);
  },
);

// --- Custom Error Class ---

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "APIError";
  }
}

// Helper to extract error message from axios errors
function handleAxiosError(error: unknown): never {
  if (error instanceof AxiosError) {
    const message =
      error.response?.data?.detail || error.message || "Network error";
    throw new APIError(message, error.response?.status, error.response?.data);
  }
  throw new APIError(error instanceof Error ? error.message : "Unknown error");
}

// --- Session Management ---

export async function startVivaSession(
  request: VivaStartRequest,
): Promise<VivaStartResponse> {
  try {
    const response = await api.post<VivaStartResponse>(
      "/api/v1/viva/start",
      request,
    );
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function concludeViva(
  request: ConcludeVivaRequest,
): Promise<ConcludeVivaResponse> {
  try {
    const response = await api.post<ConcludeVivaResponse>(
      "/api/v1/viva/conclude-viva",
      request,
    );
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export type AbandonVivaResponse = { status: "abandoned" | "completed" };

export async function abandonViva(
  sessionId: string,
): Promise<AbandonVivaResponse> {
  try {
    const response = await api.post<AbandonVivaResponse>(
      `/api/v1/viva/${sessionId}/abandon`,
    );
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

// --- Data Fetching ---

export async function getVivaSession(sessionId: string): Promise<VivaSession> {
  try {
    const response = await api.get<VivaSession>(`/api/v1/viva/${sessionId}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export default api;

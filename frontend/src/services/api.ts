import type {
  Health,
  User,
  Workspace,
  Report,
  Message,
  Source,
} from "../types";
import type { Language } from "../i18n/LanguageContext";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(75000),
    });
  } catch {
    throw new ApiError(
      0,
      "connection_error",
      "Cannot reach the server. Check that the Python backend is running, then try again.",
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      data.detail?.code || "request_failed",
      data.detail?.message || "Something went wrong. Please try again.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const api = {
  health: () => request<Health>("/health"),
  me: () => request<User>("/auth/me"),
  login: (email: string, password: string) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  analyze: (
    workspace: Workspace,
    file: File,
    task = "general",
    language: Language = "en",
  ) => {
    const body = new FormData();
    body.append("image", file);
    body.append("task", task);
    body.append("language", language);
    return request<Report>(`/${workspace}/analyze`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(90000),
    });
  },
  history: (workspace: Workspace, offset = 0) =>
    request<{ items: Report[]; total: number }>(
      `/${workspace}/history?limit=20&offset=${offset}`,
    ),
  remove: (workspace: Workspace, id: string) =>
    request<void>(`/${workspace}/history/${id}`, { method: "DELETE" }),
  chat: (
    workspace: Workspace,
    messages: Message[],
    language: Language = "en",
  ) =>
    request<{ message: string; sources: Source[] }>(`/assistant/${workspace}`, {
      method: "POST",
      body: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
        language,
      }),
    }),
};

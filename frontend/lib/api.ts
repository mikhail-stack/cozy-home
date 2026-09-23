import { useAuthStore, type AuthUser } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
}

// Единая точка обращения к backend API (docs/architecture.md). Подставляет
// access token из auth.store и один раз пробует обновить его через
// refresh-cookie при 401. Backend ещё не реализован (Auth-модуль,
// пункт 15 плана) — реальных ответов пока нет, но компоненты уже могут
// импортировать эту обёртку вместо прямого fetch.
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuthRetry, headers, ...rest } = options;
  const accessToken = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipAuthRetry: true });
    }
    useAuthStore.getState().clearSession();
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, body?.message ?? `Ошибка запроса: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// Восстанавливает сессию через refresh-cookie — вызывается автоматически
// при 401, а также будет использоваться при загрузке приложения
// (docs/architecture.md, раздел 3), когда появится реальный backend.
async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) return false;

    const data = (await response.json()) as RefreshResponse;
    useAuthStore.getState().setSession(data.user, data.accessToken);
    return true;
  } catch {
    return false;
  }
}

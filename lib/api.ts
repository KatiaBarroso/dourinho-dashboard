// Helper de fetch para os componentes client.

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && !url.endsWith("/api/signe")) {
    window.location.replace(new URL("/login", window.location.origin));
  }
  if (!response.ok) {
    throw new ApiError(data.error ?? "Erro inesperado. Tente novamente.", response.status);
  }
  return data as T;
}

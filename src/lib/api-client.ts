export class ApiError extends Error {
  archivedGroupId?: string;

  constructor(message: string, body: Record<string, unknown>) {
    super(message);
    this.archivedGroupId = typeof body.archivedGroupId === "string" ? body.archivedGroupId : undefined;
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.error?.formErrors?.[0] ?? body.error ?? `Request failed: ${response.status}`;
    throw new ApiError(message, body);
  }

  return response.json();
}
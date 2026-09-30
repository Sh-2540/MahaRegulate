import { getInMemoryToken } from '../context/AuthContext.tsx';

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { activeRole?: string; activeOrgId?: number } = {}
): Promise<T> {
  const token = getInMemoryToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.activeRole) {
    headers['x-active-role'] = options.activeRole;
  }
  if (options.activeOrgId) {
    headers['x-active-org-id'] = String(options.activeOrgId);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

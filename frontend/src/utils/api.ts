const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false,
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }

  if (res.status === 204) return null as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  upload: <T>(path: string, formData: FormData) =>
    request<T>('POST', path, formData, true),
};

export async function downloadReport(startDate: string, endDate: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(
    `${BASE}/reports/export?start_date=${startDate}&end_date=${endDate}`,
    { headers: { Authorization: `Bearer ${token || ''}` } },
  );
  if (!res.ok) throw new Error('Failed to export report');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${startDate}_${endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

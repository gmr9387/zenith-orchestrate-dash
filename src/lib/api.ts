const API_URL = (import.meta.env.VITE_API_URL as string) || "";

function hasBackend() { return Boolean(API_URL); }

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(API_URL + path);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(API_URL + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`POST ${path} ${res.status}`);
  return res.json();
}

export async function apiUpload(path: string, file: Blob, field = 'file'): Promise<void> {
  const form = new FormData();
  form.append(field, file);
  const res = await fetch(API_URL + path, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`UPLOAD ${path} ${res.status}`);
}

export { hasBackend };


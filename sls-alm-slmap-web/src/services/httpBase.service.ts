const baseURL = import.meta.env.VITE_API_BASE_URL;

import { getLanguage } from '@/stores/languageStore';

const buildHeaders = (overrides?: Record<string, string>) => {
  const lang = getLanguage() || 'en';
  return {
    'Content-Type': 'application/json',
    language: lang,
    ...overrides,
  } as Record<string, string>;
};

export const get = async <T>(url: string): Promise<T> => {
  const response = await fetch(`${baseURL}${url}`, {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'include', // Include cookies if authentication is required
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => {});
    const error: any = new Error(errorData.message ?? `Failed to fetch data`);
    error.response = { data: errorData, status: response.status };
    throw error;
  }

  return response.json().catch(() => {});
};

export const post = async <T, U = unknown>(url: string, data?: U): Promise<T> => {
  const response = await fetch(`${baseURL}/${url}`, {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => {});
    const error: any = new Error(errorData.message ?? `${'Failed to post data'}`);
    error.response = { data: errorData, status: response.status };
    throw error;
  }

  return response.json().catch(() => {});
};

export const put = async <T, U = unknown>(url: string, data: U): Promise<T> => {
  const response = await fetch(`${baseURL}/${url}`, {
    method: 'PUT',
    headers: buildHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => {});
    const error: any = new Error(errorData.message ?? `Failed to update data`);
    error.response = { data: errorData, status: response.status };
    throw error;
  }

  return response.json().catch(() => {});
};

export const del = async (url: string): Promise<void> => {
  const response = await fetch(`${baseURL}/${url}`, {
    method: 'DELETE',
    headers: buildHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => {});
    const error: any = new Error(errorData.message ?? `Failed to delete data`);
    error.response = { data: errorData, status: response.status };
    throw error;
  }
};

export const postFile = async <T>(url: string, formData: FormData): Promise<T> => {
  const headers = buildHeaders();

  delete headers['Content-Type'];

  const response = await fetch(`${baseURL}/${url}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => {});
    const error: any = new Error(errorData?.message ?? 'Failed to upload file');
    error.response = { data: errorData, status: response.status };
    throw error;
  }

  return response.json().catch(() => {});
};

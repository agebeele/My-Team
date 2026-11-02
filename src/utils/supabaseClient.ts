import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'teamgol_supabase_url';
const STORAGE_KEY_ANON = 'teamgol_supabase_anon_key';

let inMemoryUrl = '';
let inMemoryKey = '';

export const getSupabaseCredentials = (): { url: string; anonKey: string } => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let localUrl = '';
  let localKey = '';
  try {
    localUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
    localKey = (localStorage.getItem(STORAGE_KEY_ANON) || '').trim();
  } catch {
    // ignore
  }

  const url = inMemoryUrl || localUrl || envUrl;
  const anonKey = inMemoryKey || localKey || envKey;

  return { url, anonKey };
};

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  inMemoryUrl = (url || '').trim();
  inMemoryKey = (anonKey || '').trim();
  try {
    if (url) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }
    if (anonKey) {
      localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_ANON);
    }
  } catch (err) {
    console.warn('Could not save Supabase credentials to localStorage', err);
  }

  // Also push to backend so other devices automatically receive it
  fetch('/api/supabase-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: (url || '').trim(), anonKey: (anonKey || '').trim() }),
  }).catch(() => {});
};

export const initSupabaseFromServer = async (): Promise<{ url: string; anonKey: string } | null> => {
  try {
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const data = await res.json();
      if (data.url && data.anonKey) {
        inMemoryUrl = data.url;
        inMemoryKey = data.anonKey;
        try {
          localStorage.setItem(STORAGE_KEY_URL, data.url);
          localStorage.setItem(STORAGE_KEY_ANON, data.anonKey);
        } catch {}
        return { url: data.url, anonKey: data.anonKey };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch shared Supabase config from server:', err);
  }
  return null;
};

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 10);
};

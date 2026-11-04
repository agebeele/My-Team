import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'teamgol_supabase_url';
const STORAGE_KEY_ANON = 'teamgol_supabase_anon_key';

let inMemoryUrl = '';
let inMemoryKey = '';

export const cleanSupabaseUrl = (raw: string): string => {
  let u = (raw || '').trim();
  // Strip any accidental /rest/v1 or /rest/v1/ suffix
  u = u.replace(/\/rest\/v1\/?$/i, '');
  // Strip trailing slashes
  u = u.replace(/\/+$/, '');
  return u;
};

export const getSupabaseCredentials = (): { url: string; anonKey: string } => {
  const envUrl = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let localUrl = '';
  let localKey = '';
  try {
    localUrl = cleanSupabaseUrl(localStorage.getItem(STORAGE_KEY_URL) || '');
    localKey = (localStorage.getItem(STORAGE_KEY_ANON) || '').trim();
  } catch {
    // ignore
  }

  const url = cleanSupabaseUrl(inMemoryUrl || localUrl || envUrl);
  const anonKey = inMemoryKey || localKey || envKey;

  return { url, anonKey };
};

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  const sanitizedUrl = cleanSupabaseUrl(url);
  const sanitizedKey = (anonKey || '').trim();

  inMemoryUrl = sanitizedUrl;
  inMemoryKey = sanitizedKey;
  try {
    if (sanitizedUrl) {
      localStorage.setItem(STORAGE_KEY_URL, sanitizedUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }
    if (sanitizedKey) {
      localStorage.setItem(STORAGE_KEY_ANON, sanitizedKey);
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
    body: JSON.stringify({ url: sanitizedUrl, anonKey: sanitizedKey }),
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

export { supabase } from '../services/supabaseService';
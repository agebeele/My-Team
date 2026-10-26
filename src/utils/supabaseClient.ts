import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'teamgol_supabase_url';
const STORAGE_KEY_ANON = 'teamgol_supabase_anon_key';

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

  const url = localUrl || envUrl;
  const anonKey = localKey || envKey;

  return { url, anonKey };
};

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
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

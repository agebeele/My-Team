// Centralized backend synchronization with SQLite API (/api/sync)
import { TeamInfo, Player, Match, Post, StandingsRow, AppUser } from '../types';

export interface AppSyncData {
  team?: TeamInfo;
  allTeams?: TeamInfo[];
  players?: Player[];
  matches?: Match[];
  posts?: Post[];
  standings?: StandingsRow[];
  users?: AppUser[];
  version?: number;
}

let lastServerVersion = 0;
let isPushing = false;
let pendingPush: AppSyncData | null = null;
let pushTimeout: any = null;

// Fetch full synchronized state from backend SQLite
export const fetchBackendSync = async (): Promise<AppSyncData | null> => {
  try {
    const res = await fetch('/api/sync', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.version) {
      lastServerVersion = json.version;
    }
    return json;
  } catch {
    return null;
  }
};

// Immediate push without delay (for critical saves: new posts, new matches, team edits)
export const pushBackendSyncImmediate = async (data: AppSyncData): Promise<boolean> => {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.version) {
        lastServerVersion = json.version;
      }
      return true;
    }
  } catch (err) {
    console.warn('Error pushing immediate sync to SQLite backend:', err);
  }
  return false;
};

// Send changes to backend SQLite with minimal debouncing
export const pushBackendSync = (data: AppSyncData) => {
  pendingPush = { ...(pendingPush || {}), ...data };

  if (pushTimeout) {
    clearTimeout(pushTimeout);
  }

  pushTimeout = setTimeout(async () => {
    if (!pendingPush || isPushing) return;
    const payload = pendingPush;
    pendingPush = null;
    isPushing = true;

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.version) {
          lastServerVersion = json.version;
        }
      }
    } catch (err) {
      console.warn('Error pushing sync to SQLite backend:', err);
    } finally {
      isPushing = false;
      if (pendingPush) {
        pushBackendSync({});
      }
    }
  }, 50);
};

export const getServerVersion = () => lastServerVersion;

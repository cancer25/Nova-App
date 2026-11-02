import { storage } from './storage';

export interface AiQuotaState {
  remaining: number;
  max: number;
  totalRefills: number;
  lastRefillAt: string;
}

const QUOTA_STORAGE_KEY = 'nova.ai.quota.v2';
export const DEFAULT_AI_QUOTA = 13;

let currentQuota: AiQuotaState = {
  remaining: DEFAULT_AI_QUOTA,
  max: DEFAULT_AI_QUOTA,
  totalRefills: 0,
  lastRefillAt: new Date().toISOString(),
};

type Listener = (quota: AiQuotaState) => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn({ ...currentQuota });
    } catch (e) {
      console.error('Error notifying quota listener', e);
    }
  });
}

// Hydrate from storage immediately
(async () => {
  try {
    const saved = await storage.getItem<AiQuotaState | null>(QUOTA_STORAGE_KEY, null);
    if (saved && typeof saved.remaining === 'number') {
      currentQuota = {
        ...saved,
        max: DEFAULT_AI_QUOTA,
      };
      notify();
    } else {
      await storage.setItem(QUOTA_STORAGE_KEY, currentQuota);
    }
  } catch (e) {
    console.warn('Failed to load AI quota from storage', e);
  }
})();

export function getAiQuota(): AiQuotaState {
  return { ...currentQuota };
}

export function subscribeAiQuota(fn: Listener): () => void {
  listeners.add(fn);
  fn({ ...currentQuota });
  return () => {
    listeners.delete(fn);
  };
}

export async function consumeAiMessage(): Promise<{ allowed: boolean; remaining: number }> {
  if (currentQuota.remaining <= 0) {
    return { allowed: false, remaining: 0 };
  }

  const updated: AiQuotaState = {
    ...currentQuota,
    remaining: Math.max(0, currentQuota.remaining - 1),
  };

  currentQuota = updated;
  await storage.setItem(QUOTA_STORAGE_KEY, updated);
  notify();

  return { allowed: true, remaining: updated.remaining };
}

export async function refillAiQuota(amount = DEFAULT_AI_QUOTA): Promise<AiQuotaState> {
  const updated: AiQuotaState = {
    remaining: amount,
    max: amount,
    totalRefills: currentQuota.totalRefills + 1,
    lastRefillAt: new Date().toISOString(),
  };

  currentQuota = updated;
  await storage.setItem(QUOTA_STORAGE_KEY, updated);
  notify();

  return { ...updated };
}

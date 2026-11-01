import { StorageBase, StorageItemValue } from "./storage-base";

export class Storage extends StorageBase {
  async getItem<Fallback extends any>(key: string, fallback: Fallback): Promise<Fallback> {
    try {
      if (typeof window === "undefined") return fallback;
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      this.warn("getItem", key, e);
      return fallback;
    }
  }

  async setItem<Value extends any>(key: string, value: Value): Promise<boolean> {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (e) {
      this.warn("setItem", key, e);
      return false;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
      return true;
    } catch (e) {
      this.warn("removeItem", key, e);
      return false;
    }
  }

  async secureGet<Fallback extends any>(key: string, fallback: Fallback): Promise<Fallback> {
    return this.getItem(key, fallback);
  }

  async secureSet<Value extends any>(key: string, value: Value): Promise<boolean> {
    return this.setItem(key, value);
  }

  async secureRemove(key: string): Promise<boolean> {
    return this.removeItem(key);
  }
}

export const storage = new Storage();
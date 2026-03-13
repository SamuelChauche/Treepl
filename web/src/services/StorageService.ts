import { STORAGE_KEYS } from "../config/constants";

export class StorageService {
  static loadSet(key: string): Set<string> {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return new Set(JSON.parse(raw));
    } catch {
      // ignore corrupted data
    }
    return new Set();
  }

  static saveSet(key: string, set: Set<string>): void {
    localStorage.setItem(key, JSON.stringify([...set]));
  }

  static loadCart(): Set<string> {
    return StorageService.loadSet(STORAGE_KEYS.CART);
  }

  static saveCart(cart: Set<string>): void {
    StorageService.saveSet(STORAGE_KEYS.CART, cart);
  }

  static loadTopics(): Set<string> {
    return StorageService.loadSet(STORAGE_KEYS.TOPICS);
  }

  static saveTopics(topics: Set<string>): void {
    StorageService.saveSet(STORAGE_KEYS.TOPICS, topics);
  }
}

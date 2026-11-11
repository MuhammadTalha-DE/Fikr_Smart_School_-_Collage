const DEFAULT_MAX_ENTRIES = 500;

class MemoryCacheStore {
  constructor({ maxEntries = DEFAULT_MAX_ENTRIES } = {}) {
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);

    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttlMs) {
    if (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) this.entries.delete(oldestKey);
    }

    this.entries.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clearNamespace(namespace) {
    const prefix = `${namespace}:`;

    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }

  clearAll() {
    this.entries.clear();
  }

  stats() {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const entry of this.entries.values()) {
      if (entry.expiresAt > now) active += 1;
      else expired += 1;
    }

    return {
      active,
      expired,
      total: this.entries.size,
      maxEntries: this.maxEntries,
    };
  }
}

const cacheStore = new MemoryCacheStore();

module.exports = {
  MemoryCacheStore,
  cacheStore,
};

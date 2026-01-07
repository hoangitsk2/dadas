import { APIKeyRecord, APIKeyUsage, ModelId } from "./types";

const MILLIS_PER_MINUTE = 60 * 1000;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

const isExpired = (lastReset: Date, windowMs: number) => {
  return Date.now() - lastReset.getTime() >= windowMs;
};

const resetUsageWindow = (usage: APIKeyUsage, windowMs: number) => {
  if (isExpired(usage.lastReset, windowMs)) {
    usage.requests = 0;
    usage.tokens = 0;
    usage.lastReset = new Date();
  }
};

export class APIManager {
  private keys: APIKeyRecord[];

  constructor(keys: APIKeyRecord[]) {
    this.keys = keys;
  }

  listKeys(): APIKeyRecord[] {
    return [...this.keys];
  }

  addKey(key: APIKeyRecord) {
    this.keys.push(key);
  }

  getNextAvailableKey(model: ModelId): APIKeyRecord | null {
    const candidates = this.keys.filter(
      (key) => key.isActive && key.models.includes(model),
    );

    const withQuota = candidates.filter((key) => this.hasQuota(key, model));
    if (withQuota.length === 0) {
      return null;
    }

    return withQuota.sort((a, b) => {
      const usageA = this.getUsage(a, model);
      const usageB = this.getUsage(b, model);
      const remainingA = this.remainingQuotaScore(usageA);
      const remainingB = this.remainingQuotaScore(usageB);
      return remainingB - remainingA;
    })[0];
  }

  updateUsage(
    keyId: string,
    model: ModelId,
    tokens: number,
    requests: number,
  ) {
    const key = this.keys.find((item) => item.id === keyId);
    if (!key) {
      return;
    }

    const usage = this.getUsage(key, model);
    resetUsageWindow(usage, MILLIS_PER_MINUTE);
    resetUsageWindow(usage, MILLIS_PER_DAY);

    usage.tokens += tokens;
    usage.requests += requests;
  }

  markInactive(keyId: string) {
    const key = this.keys.find((item) => item.id === keyId);
    if (key) {
      key.isActive = false;
    }
  }

  private getUsage(key: APIKeyRecord, model: ModelId): APIKeyUsage {
    const usage = key.usage.get(model);
    if (!usage) {
      throw new Error(`Missing usage for model ${model} on key ${key.id}`);
    }
    return usage;
  }

  private remainingQuotaScore(usage: APIKeyUsage): number {
    const rpmRemaining = usage.rpmLimit - usage.requests;
    const tpmRemaining = usage.tpmLimit - usage.tokens;
    const rpdRemaining = usage.rpdLimit - usage.requests;
    return rpmRemaining + tpmRemaining + rpdRemaining;
  }

  private hasQuota(key: APIKeyRecord, model: ModelId): boolean {
    const usage = this.getUsage(key, model);
    resetUsageWindow(usage, MILLIS_PER_MINUTE);
    resetUsageWindow(usage, MILLIS_PER_DAY);

    return (
      usage.requests < usage.rpmLimit &&
      usage.tokens < usage.tpmLimit &&
      usage.requests < usage.rpdLimit
    );
  }
}

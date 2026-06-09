import { Injectable } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

@Injectable()
export class RateLimiterService {
  private readonly store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Auto-cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Check if a key has exceeded its rate limit.
   * Returns true if the request is allowed, false if blocked.
   */
  checkLimit(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      return true;
    }

    // If currently blocked, check if block has expired
    if (entry.blockedUntil !== null) {
      if (now < entry.blockedUntil) {
        return false;
      }
      // Block expired, reset the entry
      this.store.delete(key);
      return true;
    }

    // If the window has expired, reset
    if (now - entry.firstAttempt > windowMs) {
      this.store.delete(key);
      return true;
    }

    // If count has reached max, block
    if (entry.count >= max) {
      entry.blockedUntil = now + windowMs;
      return false;
    }

    return true;
  }

  /**
   * Increment the attempt counter for a key.
   */
  increment(key: string, windowMs: number): void {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, {
        count: 1,
        firstAttempt: now,
        blockedUntil: null,
      });
      return;
    }

    // If the window has expired, start fresh
    if (now - entry.firstAttempt > windowMs) {
      this.store.set(key, {
        count: 1,
        firstAttempt: now,
        blockedUntil: null,
      });
      return;
    }

    entry.count++;
  }

  /**
   * Reset the counter for a key (e.g., on successful login).
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get remaining block time in seconds for a key.
   * Returns 0 if not blocked.
   */
  getRemainingTime(key: string): number {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.blockedUntil === null) {
      return 0;
    }

    const remaining = entry.blockedUntil - now;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Clean up expired entries from the store.
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      // Remove entries whose block has expired
      if (entry.blockedUntil !== null && now >= entry.blockedUntil) {
        this.store.delete(key);
        continue;
      }

      // Remove entries whose window has long expired (use 30min as max window)
      if (entry.blockedUntil === null && now - entry.firstAttempt > 30 * 60 * 1000) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval (for graceful shutdown).
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Caching Utilities
 * 
 * This file contains utilities for caching API responses to reduce costs and improve performance.
 */

interface CacheOptions {
  /**
   * Time in seconds for how long the cache should be valid
   * Default: 3600 (1 hour)
   */
  expiresIn?: number;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

/**
 * In-memory cache for API responses
 */
const memoryCache: Record<string, CacheItem<any>> = {};

/**
 * Generate a cache key based on the API endpoint and request parameters
 */
export function generateCacheKey(endpoint: string, params: any): string {
  // Sort params to ensure consistent key generation
  const sortedParams = Object.keys(params || {})
    .sort()
    .reduce((result: Record<string, any>, key) => {
      result[key] = params[key];
      return result;
    }, {});
  
  return `${endpoint}:${JSON.stringify(sortedParams)}`;
}

/**
 * Get data from cache if available and not expired
 * @returns The cached data or null if not found or expired
 */
export function getFromCache<T>(cacheKey: string): T | null {
  const cachedItem = memoryCache[cacheKey];
  
  if (!cachedItem) {
    return null;
  }
  
  const now = Date.now();
  const isExpired = (now - cachedItem.timestamp) > (cachedItem.expiresIn * 1000);
  
  if (isExpired) {
    // Remove expired item from cache
    delete memoryCache[cacheKey];
    return null;
  }
  
  console.log(`[Cache] Cache hit for key: ${cacheKey}`);
  return cachedItem.data;
}

/**
 * Store data in cache
 */
export function storeInCache<T>(
  cacheKey: string, 
  data: T, 
  options: CacheOptions = {}
): void {
  const expiresIn = options.expiresIn || 3600; // Default 1 hour
  
  memoryCache[cacheKey] = {
    data,
    timestamp: Date.now(),
    expiresIn
  };
  
  console.log(`[Cache] Stored in cache with key: ${cacheKey}, expires in ${expiresIn}s`);
}

/**
 * Clear the entire cache or a specific key
 */
export function clearCache(cacheKey?: string): void {
  if (cacheKey) {
    delete memoryCache[cacheKey];
    console.log(`[Cache] Cleared cache for key: ${cacheKey}`);
  } else {
    Object.keys(memoryCache).forEach(key => {
      delete memoryCache[key];
    });
    console.log(`[Cache] Cleared entire cache`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  const keys = Object.keys(memoryCache);
  
  const stats = {
    total: keys.length,
    active: 0,
    expired: 0,
    keys: {} as Record<string, { expiresIn: number, remainingTime: number }>
  };
  
  keys.forEach(key => {
    const item = memoryCache[key];
    const elapsedMs = now - item.timestamp;
    const isExpired = elapsedMs > (item.expiresIn * 1000);
    
    if (isExpired) {
      stats.expired++;
    } else {
      stats.active++;
      stats.keys[key] = {
        expiresIn: item.expiresIn,
        remainingTime: Math.round((item.expiresIn * 1000 - elapsedMs) / 1000)
      };
    }
  });
  
  return stats;
}

/**
 * Higher-order function to cache API responses
 * @param apiFunction - The API function to cache
 * @param options - Cache options
 * @returns A function that returns cached data or calls the API function
 */
export function withCache<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  endpoint: string,
  options: CacheOptions = {}
) {
  return async function(...args: P): Promise<T> {
    // Generate cache key using the first argument as params
    // This assumes the first argument is the params object
    const params = args[0] || {};
    const cacheKey = generateCacheKey(endpoint, params);
    
    // Try to get from cache first
    const cachedData = getFromCache<T>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }
    
    // Call the API function if not in cache
    const result = await apiFunction(...args);
    
    // Store the result in cache
    storeInCache(cacheKey, result, options);
    
    return result;
  };
}

export default {
  generateCacheKey,
  getFromCache,
  storeInCache,
  clearCache,
  getCacheStats,
  withCache
}; 
import { performance } from 'perf_hooks';

// Performance monitoring utilities
export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.operationCounts = new Map();
    }

    startOperation(name) {
        const startTime = performance.now();
        return () => {
            const duration = performance.now() - startTime;
            this.recordMetric(name, duration);
        };
    }

    recordMetric(name, duration) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, {
                count: 0,
                totalDuration: 0,
                minDuration: Infinity,
                maxDuration: -Infinity,
                avgDuration: 0
            });
        }

        const metric = this.metrics.get(name);
        metric.count++;
        metric.totalDuration += duration;
        metric.minDuration = Math.min(metric.minDuration, duration);
        metric.maxDuration = Math.max(metric.maxDuration, duration);
        metric.avgDuration = metric.totalDuration / metric.count;

        // Track operation counts for rate limiting insights
        const now = Date.now();
        if (!this.operationCounts.has(name)) {
            this.operationCounts.set(name, []);
        }
        const counts = this.operationCounts.get(name);
        counts.push(now);
        // Keep only last 5 minutes of data
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        this.operationCounts.set(name, counts.filter(time => time > fiveMinutesAgo));
    }

    getMetrics() {
        const results = {};
        for (const [name, metric] of this.metrics) {
            const operationRate = this.getOperationRate(name);
            results[name] = {
                ...metric,
                avgDuration: Math.round(metric.avgDuration * 100) / 100,
                minDuration: Math.round(metric.minDuration * 100) / 100,
                maxDuration: Math.round(metric.maxDuration * 100) / 100,
                operationRate: `${operationRate} ops/min`
            };
        }
        return results;
    }

    getOperationRate(name) {
        const counts = this.operationCounts.get(name) || [];
        if (counts.length < 2) return 0;
        
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const recentCounts = counts.filter(time => time > oneMinuteAgo);
        return recentCounts.length;
    }

    reset() {
        this.metrics.clear();
        this.operationCounts.clear();
    }
}

// Request debouncing utility
export class RequestDebouncer {
    constructor() {
        this.pendingRequests = new Map();
        this.requestCache = new Map();
    }

    debounce(key, fn, delay = 100) {
        // Check cache first
        const cached = this.requestCache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return Promise.resolve(cached.result);
        }

        // Clear existing timeout
        if (this.pendingRequests.has(key)) {
            clearTimeout(this.pendingRequests.get(key).timeout);
        }

        // Create new promise
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(async () => {
                this.pendingRequests.delete(key);
                try {
                    const result = await fn();
                    // Cache the result
                    this.requestCache.set(key, {
                        result,
                        timestamp: Date.now(),
                        ttl: 5000 // 5 second cache
                    });
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, delay);

            this.pendingRequests.set(key, { timeout, resolve, reject });
        });
    }

    clearCache(keyPattern) {
        if (keyPattern) {
            for (const key of this.requestCache.keys()) {
                if (key.includes(keyPattern)) {
                    this.requestCache.delete(key);
                }
            }
        } else {
            this.requestCache.clear();
        }
    }
}

// Batch processor for SVN operations
export class BatchProcessor {
    constructor(processFn, options = {}) {
        this.processFn = processFn;
        this.batchSize = options.batchSize || 10;
        this.delay = options.delay || 100;
        this.queue = [];
        this.processing = false;
    }

    add(item) {
        return new Promise((resolve, reject) => {
            this.queue.push({ item, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        
        // Process in batches
        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, this.batchSize);
            
            try {
                const items = batch.map(b => b.item);
                const results = await this.processFn(items);
                
                // Resolve individual promises
                batch.forEach((b, index) => {
                    b.resolve(results[index]);
                });
            } catch (error) {
                // Reject all promises in the batch
                batch.forEach(b => b.reject(error));
            }

            // Delay between batches
            if (this.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.delay));
            }
        }

        this.processing = false;
    }
}

// Memory cache with TTL and size limits
export class MemoryCache {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 1000;
        this.defaultTTL = options.defaultTTL || 60000; // 1 minute
        this.cache = new Map();
        this.accessOrder = [];
        
        // Cleanup interval
        setInterval(() => this.cleanup(), 30000); // Every 30 seconds
    }

    set(key, value, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + ttl;
        
        // Remove oldest item if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldestKey = this.accessOrder.shift();
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, { value, expiresAt });
        
        // Update access order
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            const index = this.accessOrder.indexOf(key);
            if (index > -1) {
                this.accessOrder.splice(index, 1);
            }
            return null;
        }

        // Update access order
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
            this.accessOrder.push(key);
        }

        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        this.cache.delete(key);
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }

    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        
        for (const [key, item] of this.cache) {
            if (now > item.expiresAt) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.delete(key));
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100)
        };
    }
}
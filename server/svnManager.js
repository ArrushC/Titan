import { MemoryCache, BatchProcessor, RequestDebouncer, PerformanceMonitor } from './performance.js';
import svnUltimate from 'node-svn-ultimate';

export class SVNManager {
    constructor(logger) {
        this.logger = logger;
        this.cache = new MemoryCache({ maxSize: 500, defaultTTL: 30000 }); // 30s TTL
        this.debouncer = new RequestDebouncer();
        this.performanceMonitor = new PerformanceMonitor();
        
        // Track operation failures for smart throttling
        this.failureTracker = new Map();
        this.FAILURE_THRESHOLD = 3;
        this.FAILURE_WINDOW = 60000; // 1 minute
        
        // Batch processor for status checks
        this.statusBatcher = new BatchProcessor(
            (branches) => this.batchStatusCheck(branches),
            { batchSize: 5, delay: 200 }
        );
    }

    async executeSVNCommand(cmd) {
        const endTimer = this.performanceMonitor.startOperation(`svn_${cmd.command}`);
        
        try {
            // Check if operation should be throttled
            if (this.shouldThrottle(cmd)) {
                throw new Error(`Operation throttled due to repeated failures: ${cmd.command} for ${cmd.args[0]}`);
            }

            const result = await this._executeCommand(cmd);
            this.recordSuccess(cmd);
            return result;
        } catch (error) {
            this.recordFailure(cmd, error);
            throw error;
        } finally {
            endTimer();
        }
    }

    async _executeCommand(cmd) {
        return new Promise((resolve, reject) => {
            const args = Array.isArray(cmd.args) ? cmd.args : [cmd.args];
            const options = cmd.options || {};
            args.push(options);

            const callback = (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ command: cmd.command, result });
                }
            };

            if (cmd.isUtilityCmd) {
                if (typeof svnUltimate.util[cmd.command] !== "function") {
                    return reject(new Error(`Invalid SVN utility command: ${cmd.command}`));
                }
                svnUltimate.util[cmd.command](...args, callback);
            } else {
                if (typeof svnUltimate.commands[cmd.command] !== "function") {
                    return reject(new Error(`Invalid SVN command: ${cmd.command}`));
                }
                svnUltimate.commands[cmd.command](...args, callback);
            }
        });
    }

    async executeBatch(commands) {
        // Group commands by type for better performance
        const grouped = this.groupCommandsByType(commands);
        const results = [];

        for (const [type, cmds] of Object.entries(grouped)) {
            // Execute read operations in parallel, write operations sequentially
            if (['info', 'status', 'log'].includes(type)) {
                const batchResults = await Promise.all(
                    cmds.map(cmd => this.executeSVNCommand(cmd).catch(err => ({ command: cmd.command, error: err })))
                );
                results.push(...batchResults);
            } else {
                for (const cmd of cmds) {
                    try {
                        const result = await this.executeSVNCommand(cmd);
                        results.push(result);
                    } catch (error) {
                        results.push({ command: cmd.command, error });
                    }
                }
            }
        }

        return results;
    }

    groupCommandsByType(commands) {
        return commands.reduce((acc, cmd) => {
            if (!acc[cmd.command]) {
                acc[cmd.command] = [];
            }
            acc[cmd.command].push(cmd);
            return acc;
        }, {});
    }

    // Optimized branch info check with caching
    async getBranchInfo(branchPath) {
        const cacheKey = `branch_info_${branchPath}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            this.logger.debug(`Cache hit for branch info: ${branchPath}`);
            return cached;
        }

        // Debounce multiple requests for the same branch
        return this.debouncer.debounce(cacheKey, async () => {
            const endTimer = this.performanceMonitor.startOperation('getBranchInfo');
            
            try {
                const tasks = [
                    { command: "getWorkingCopyRevision", args: [branchPath], isUtilityCmd: true },
                    { command: "info", args: [branchPath] },
                    { command: "status", args: [branchPath], options: { quiet: true, params: ["--show-updates"] } }
                ];

                const results = await this.executeBatch(tasks);
                
                // Only fetch logs if needed (not latest)
                const wcRevision = results.find(r => r.command === "getWorkingCopyRevision")?.result?.low;
                const infoResult = results.find(r => r.command === "info")?.result;
                const statusResult = results.find(r => r.command === "status")?.result;

                let logResult = null;
                if (infoResult && wcRevision && infoResult.entry.$.revision !== wcRevision) {
                    const logTask = { command: "log", args: [branchPath], options: { revision: "BASE:HEAD" } };
                    const logResults = await this.executeSVNCommand(logTask);
                    logResult = logResults.result;
                }

                const branchInfo = {
                    wcRevision,
                    baseRevision: infoResult?.entry?.$.revision,
                    info: infoResult,
                    status: statusResult,
                    logs: logResult
                };

                // Cache the result
                this.cache.set(cacheKey, branchInfo);
                
                return branchInfo;
            } finally {
                endTimer();
            }
        }, 100); // 100ms debounce
    }

    // Batch status check for multiple branches
    async batchStatusCheck(branches) {
        const endTimer = this.performanceMonitor.startOperation('batchStatusCheck');
        
        try {
            // Create tasks for all branches
            const tasks = branches.flatMap(branch => [
                { command: "status", args: [branch], options: { quiet: false, params: ["--show-updates"] } }
            ]);

            // Execute in parallel with a limit
            const results = await this.executeBatch(tasks);
            
            // Map results back to branches
            return branches.map(branch => {
                const statusResult = results.find(r => 
                    r.command === "status" && r.result?.target?.$.path === branch
                );
                return statusResult?.result || null;
            });
        } finally {
            endTimer();
        }
    }

    // Smart throttling based on failure patterns
    shouldThrottle(cmd) {
        const key = `${cmd.command}_${cmd.args[0]}`;
        const failures = this.failureTracker.get(key) || [];
        
        // Clean old failures
        const now = Date.now();
        const recentFailures = failures.filter(f => now - f.timestamp < this.FAILURE_WINDOW);
        
        if (recentFailures.length >= this.FAILURE_THRESHOLD) {
            this.logger.warn(`Throttling ${cmd.command} for ${cmd.args[0]} due to ${recentFailures.length} recent failures`);
            return true;
        }

        return false;
    }

    recordFailure(cmd, error) {
        const key = `${cmd.command}_${cmd.args[0]}`;
        const failures = this.failureTracker.get(key) || [];
        
        failures.push({
            timestamp: Date.now(),
            error: error.message
        });

        // Keep only recent failures
        const now = Date.now();
        const recentFailures = failures.filter(f => now - f.timestamp < this.FAILURE_WINDOW);
        this.failureTracker.set(key, recentFailures);
    }

    recordSuccess(cmd) {
        const key = `${cmd.command}_${cmd.args[0]}`;
        // Clear failure history on success
        this.failureTracker.delete(key);
    }

    // Get performance metrics
    getPerformanceMetrics() {
        return {
            svnOperations: this.performanceMonitor.getMetrics(),
            cacheStats: this.cache.getStats(),
            failureStats: this.getFailureStats()
        };
    }

    getFailureStats() {
        const stats = {};
        for (const [key, failures] of this.failureTracker) {
            stats[key] = {
                recentFailures: failures.length,
                lastFailure: failures[failures.length - 1]?.timestamp || null
            };
        }
        return stats;
    }

    // Clear caches when needed
    clearCache(pattern) {
        if (pattern) {
            // Clear specific cache entries
            for (const key of this.cache.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
            this.debouncer.clearCache(pattern);
        } else {
            // Clear all caches
            this.cache.clear();
            this.debouncer.clearCache();
        }
    }
}
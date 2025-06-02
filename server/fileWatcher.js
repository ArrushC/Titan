import chokidar from 'chokidar';
import { MemoryCache, RequestDebouncer } from './performance.js';

export class FileWatcher {
    constructor(logger, svnManager) {
        this.logger = logger;
        this.svnManager = svnManager;
        this.watchers = new Map();
        this.eventDebouncer = new RequestDebouncer();
        this.changeCache = new MemoryCache({ maxSize: 1000, defaultTTL: 5000 });
        
        // Batch change processing
        this.pendingChanges = new Map();
        this.batchInterval = 300; // 300ms batch window
        this.batchTimers = new Map();
    }

    async watchBranch(branchPath, options = {}) {
        if (this.watchers.has(branchPath)) {
            this.logger.debug(`Watcher already exists for branch: ${branchPath}`);
            return this.watchers.get(branchPath);
        }

        const { ignoredPaths = [], onFileChange } = options;
        
        // Optimized watcher configuration
        const watcherOptions = {
            ignored: [
                /(^|[\/\\])\../,  // Hidden files
                /node_modules/,    // Common large directories
                /.svn/,           // SVN metadata
                ...ignoredPaths.map(path => new RegExp(path))
            ],
            persistent: true,
            ignoreInitial: true,
            usePolling: false,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100
            },
            depth: 10,
            alwaysStat: false,
            ignorePermissionErrors: true,
            atomic: true, // Handle atomic saves
            
            // Performance optimizations
            binaryInterval: 300,
            interval: 100,
            followSymlinks: false
        };

        const watcher = chokidar.watch(branchPath, watcherOptions);
        
        // Setup optimized event handlers
        this.setupWatcherEvents(watcher, branchPath, onFileChange);
        
        // Store watcher reference
        this.watchers.set(branchPath, {
            watcher,
            path: branchPath,
            options
        });

        // Wait for ready event
        await new Promise((resolve) => {
            watcher.once('ready', () => {
                this.logger.info(`Watcher ready for branch: ${branchPath}`);
                resolve();
            });
        });

        return this.watchers.get(branchPath);
    }

    setupWatcherEvents(watcher, branchPath, onFileChange) {
        const handleEvent = (eventType, filePath, stats) => {
            // Debounce rapid file changes
            const cacheKey = `${eventType}_${filePath}`;
            
            this.eventDebouncer.debounce(cacheKey, async () => {
                // Check if we've already processed this recently
                if (this.changeCache.has(cacheKey)) {
                    return;
                }

                // Add to batch
                this.addToBatch(branchPath, {
                    type: eventType,
                    path: filePath,
                    stats,
                    timestamp: Date.now()
                });

                // Cache to prevent duplicate processing
                this.changeCache.set(cacheKey, true);
            }, 100);
        };

        // File events
        watcher
            .on('add', (path, stats) => handleEvent('add', path, stats))
            .on('change', (path, stats) => handleEvent('change', path, stats))
            .on('unlink', (path) => handleEvent('unlink', path))
            .on('addDir', (path, stats) => handleEvent('addDir', path, stats))
            .on('unlinkDir', (path) => handleEvent('unlinkDir', path));

        // Error handling
        watcher.on('error', (error) => {
            this.logger.error(`Watcher error for ${branchPath}:`, error);
            
            // Attempt to recover
            if (error.code === 'ENOSPC') {
                this.logger.error('System limit for file watchers reached. Attempting to recover...');
                this.optimizeWatchers();
            }
        });

        // Process batched changes
        if (onFileChange) {
            this.setupBatchProcessor(branchPath, onFileChange);
        }
    }

    addToBatch(branchPath, change) {
        if (!this.pendingChanges.has(branchPath)) {
            this.pendingChanges.set(branchPath, []);
        }

        this.pendingChanges.get(branchPath).push(change);

        // Reset batch timer
        if (this.batchTimers.has(branchPath)) {
            clearTimeout(this.batchTimers.get(branchPath));
        }

        const timer = setTimeout(() => {
            this.processBatch(branchPath);
        }, this.batchInterval);

        this.batchTimers.set(branchPath, timer);
    }

    async processBatch(branchPath) {
        const changes = this.pendingChanges.get(branchPath) || [];
        if (changes.length === 0) return;

        // Clear pending changes
        this.pendingChanges.set(branchPath, []);
        this.batchTimers.delete(branchPath);

        // Group changes by type for efficient processing
        const grouped = this.groupChangesByType(changes);
        
        // Process each type of change
        const watcherInfo = this.watchers.get(branchPath);
        if (watcherInfo && watcherInfo.options.onFileChange) {
            try {
                // Get SVN status for all changed files in one batch
                const filePaths = changes.map(c => c.path);
                const statusResults = await this.batchGetSVNStatus(filePaths, branchPath);

                // Emit changes with status information
                const enrichedChanges = changes.map((change, index) => ({
                    ...change,
                    svnStatus: statusResults[index]
                }));

                watcherInfo.options.onFileChange(enrichedChanges, branchPath);
            } catch (error) {
                this.logger.error(`Error processing batch for ${branchPath}:`, error);
            }
        }
    }

    groupChangesByType(changes) {
        return changes.reduce((acc, change) => {
            if (!acc[change.type]) {
                acc[change.type] = [];
            }
            acc[change.type].push(change);
            return acc;
        }, {});
    }

    async batchGetSVNStatus(filePaths, branchPath) {
        if (!this.svnManager) return filePaths.map(() => null);

        // Create batch of status commands
        const tasks = filePaths.map(filePath => ({
            command: 'status',
            args: [filePath],
            options: { quiet: false, params: ['--show-updates'] }
        }));

        try {
            const results = await this.svnManager.executeBatch(tasks);
            return results.map(result => {
                if (result.error) return null;
                
                const entry = result.result?.target?.entry;
                const wcStatus = entry?.['wc-status']?.$?.item || null;
                const reposStatus = entry?.['repos-status']?.$?.item || null;
                
                return { wcStatus, reposStatus };
            });
        } catch (error) {
            this.logger.error('Error getting batch SVN status:', error);
            return filePaths.map(() => null);
        }
    }

    async unwatchBranch(branchPath) {
        const watcherInfo = this.watchers.get(branchPath);
        if (!watcherInfo) {
            this.logger.debug(`No watcher found for branch: ${branchPath}`);
            return;
        }

        try {
            await watcherInfo.watcher.close();
            this.watchers.delete(branchPath);
            
            // Clean up related data
            this.pendingChanges.delete(branchPath);
            if (this.batchTimers.has(branchPath)) {
                clearTimeout(this.batchTimers.get(branchPath));
                this.batchTimers.delete(branchPath);
            }
            
            this.logger.info(`Unwatched branch: ${branchPath}`);
        } catch (error) {
            this.logger.error(`Error unwatching branch ${branchPath}:`, error);
        }
    }

    async updateWatchers(branchPaths, options = {}) {
        const currentPaths = new Set(this.watchers.keys());
        const newPaths = new Set(branchPaths);

        // Remove watchers for paths no longer in the list
        for (const path of currentPaths) {
            if (!newPaths.has(path)) {
                await this.unwatchBranch(path);
            }
        }

        // Add watchers for new paths
        for (const path of newPaths) {
            if (!currentPaths.has(path)) {
                await this.watchBranch(path, options);
            }
        }
    }

    // Optimize watchers to handle system limits
    async optimizeWatchers() {
        this.logger.info('Optimizing file watchers...');
        
        // Get current watcher count
        const watcherCount = this.watchers.size;
        
        if (watcherCount > 50) {
            this.logger.warn(`High number of watchers detected: ${watcherCount}. Consider reducing watched paths.`);
            
            // Implement watcher pooling for large numbers
            // This is a placeholder for more sophisticated pooling logic
            // In practice, you might want to implement a priority system
        }

        // Clear caches to free memory
        this.changeCache.clear();
        this.eventDebouncer.clearCache();
    }

    async close() {
        this.logger.info('Closing all file watchers...');
        
        // Process any pending changes
        for (const branchPath of this.pendingChanges.keys()) {
            await this.processBatch(branchPath);
        }

        // Close all watchers
        const promises = Array.from(this.watchers.keys()).map(path => 
            this.unwatchBranch(path)
        );
        
        await Promise.all(promises);
        
        // Clear all data
        this.pendingChanges.clear();
        this.batchTimers.clear();
        this.changeCache.clear();
        
        this.logger.info('All file watchers closed.');
    }

    getStats() {
        return {
            activeWatchers: this.watchers.size,
            pendingChanges: Array.from(this.pendingChanges.entries()).map(([path, changes]) => ({
                path,
                pendingCount: changes.length
            })),
            cacheSize: this.changeCache.getStats()
        };
    }
}
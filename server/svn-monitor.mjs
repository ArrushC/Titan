/**
 * SVN Monitoring Module
 * Tracks SVN operations and provides real-time dashboard data
 */

import { promises as fs } from 'fs';
import path from 'path';

export class SVNMonitor {
    constructor(io, logger, config = null) {
        this.io = io;
        this.logger = logger;
        this.config = config;
        this.svnDataFilePath = 'C:\\Titan\\Titan.svnMonitorData.json';
        
        // SVN Dashboard Data Storage
        this.dashboardData = {
            activities: [],
            stats: {
                totalCommits: 0,
                activeBranches: 0,
                fileChanges: 0,
                mergeOps: 0,
                commitChange: 0,
                branchChange: 0,
                filesModified: 0,
                filesAdded: 0,
                conflictCount: 0
            },
            branches: [],
            heatmapData: {},
            dailyStats: {}
        };

        // Initialize with real data (async)
        this.initializeRealData().catch(error => {
            this.logger.error('Error initializing SVN monitor data:', error);
        });
        
        // Update branch statistics every minute
        this.updateInterval = setInterval(() => {
            this.updateBranchStats();
        }, 60000);

        // Save data every 5 minutes
        this.saveInterval = setInterval(() => {
            this.saveMonitoringData();
        }, 300000);
    }

    async initializeRealData() {
        try {
            // Load existing monitoring data if available
            await this.loadMonitoringData();
        } catch (error) {
            this.logger.warn('No existing monitoring data found, initializing fresh data');
        }

        // Initialize heatmap data if empty
        if (Object.keys(this.dashboardData.heatmapData).length === 0) {
            this.initializeHeatmapData();
        }

        // Initialize today's stats if needed
        const todayStr = new Date().toISOString().split('T')[0];
        if (!this.dashboardData.dailyStats[todayStr]) {
            this.dashboardData.dailyStats[todayStr] = {
                commits: 0,
                updates: 0,
                merges: 0,
                files: { added: 0, modified: 0, deleted: 0 },
                conflicts: 0
            };
        }

        // Load real branch data from config
        if (this.config && this.config.branches) {
            this.loadBranchesFromConfig();
        }

        this.dashboardData.stats.activeBranches = this.dashboardData.branches.filter(b => b.active).length;
        this.logger.info(`SVN Monitor initialized with ${this.dashboardData.branches.length} branches`);
    }

    /**
     * Update configuration data when config changes
     */
    updateConfig(newConfig) {
        this.config = newConfig;
        if (newConfig && newConfig.branches) {
            this.loadBranchesFromConfig();
            this.dashboardData.stats.activeBranches = this.dashboardData.branches.filter(b => b.active).length;
            this.io.emit('svn-branches-update', this.dashboardData.branches);
            this.logger.info(`SVN Monitor config updated with ${this.dashboardData.branches.length} branches`);
        }
    }

    initializeHeatmapData() {
        // Initialize heatmap with minimal data for the last 12 weeks
        const today = new Date();
        for (let weeks = 0; weeks < 12; weeks++) {
            for (let days = 0; days < 7; days++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (weeks * 7) - days);
                const dateStr = date.toISOString().split('T')[0];
                if (!this.dashboardData.heatmapData[dateStr]) {
                    this.dashboardData.heatmapData[dateStr] = 0;
                }
            }
        }
    }

    loadBranchesFromConfig() {
        if (!this.config || !this.config.branches) return;

        // Convert Titan config branches to monitoring format
        this.dashboardData.branches = this.config.branches.map(branch => {
            const existingBranch = this.dashboardData.branches.find(b => 
                b.svnPath === branch['SVN Branch']
            );

            return {
                name: this.extractBranchName(branch['SVN Branch']),
                svnPath: branch['SVN Branch'],
                folder: branch['Branch Folder'] || 'Default',
                version: branch['Branch Version'] || '',
                active: true,
                commits: existingBranch?.commits || 0,
                lastActivity: existingBranch?.lastActivity || new Date().toLocaleDateString(),
                contributors: existingBranch?.contributors || 1,
                info: branch['Branch Info'] || 'Ready'
            };
        });
    }

    async loadMonitoringData() {
        try {
            const data = await fs.readFile(this.svnDataFilePath, 'utf8');
            const savedData = JSON.parse(data);
            
            // Merge saved data with current structure
            this.dashboardData = {
                ...this.dashboardData,
                ...savedData,
                // Ensure arrays exist
                activities: savedData.activities || [],
                branches: savedData.branches || [],
                // Ensure objects exist
                stats: { ...this.dashboardData.stats, ...savedData.stats },
                heatmapData: savedData.heatmapData || {},
                dailyStats: savedData.dailyStats || {}
            };
            
            this.logger.info('SVN monitoring data loaded successfully');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                this.logger.error('Error loading SVN monitoring data:', error);
            }
            throw error;
        }
    }

    async saveMonitoringData() {
        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(this.svnDataFilePath), { recursive: true });
            
            // Save current monitoring data
            const dataToSave = {
                ...this.dashboardData,
                lastSaved: new Date().toISOString()
            };
            
            await fs.writeFile(this.svnDataFilePath, JSON.stringify(dataToSave, null, 2));
            this.logger.debug('SVN monitoring data saved successfully');
        } catch (error) {
            this.logger.error('Error saving SVN monitoring data:', error);
        }
    }

    /**
     * Track SVN activities
     */
    trackActivity(type, details, metadata = {}) {
        const activity = {
            type,
            details,
            timestamp: new Date(),
            metadata
        };
        
        this.dashboardData.activities.unshift(activity);
        if (this.dashboardData.activities.length > 100) {
            this.dashboardData.activities.pop();
        }
        
        // Update stats based on activity type
        this.updateStatsFromActivity(type, metadata);
        
        // Emit real-time updates
        this.io.emit('svn-activity-update', activity);
        this.io.emit('svn-stats-update', this.dashboardData.stats);
        
        this.logger.info(`SVN Activity tracked: ${type} - ${details}`);
    }

    updateStatsFromActivity(type, metadata = {}) {
        const today = new Date().toISOString().split('T')[0];
        if (!this.dashboardData.dailyStats[today]) {
            this.dashboardData.dailyStats[today] = {
                commits: 0,
                updates: 0,
                merges: 0,
                files: { added: 0, modified: 0, deleted: 0 },
                conflicts: 0
            };
        }
        
        const dailyStats = this.dashboardData.dailyStats[today];
        
        switch (type) {
            case 'COMMIT':
                this.dashboardData.stats.totalCommits++;
                dailyStats.commits++;
                // Update heatmap
                this.dashboardData.heatmapData[today] = (this.dashboardData.heatmapData[today] || 0) + 1;
                
                // Update branch commit count
                if (metadata.branchPath) {
                    const branch = this.dashboardData.branches.find(b => 
                        b.svnPath === metadata.branchPath || 
                        metadata.branchPath.includes(b.name) ||
                        b.svnPath.includes(metadata.branchPath)
                    );
                    if (branch) {
                        branch.commits++;
                        branch.lastActivity = new Date().toLocaleDateString();
                        this.io.emit('svn-branches-update', this.dashboardData.branches);
                    }
                }
                break;
                
            case 'UPDATE':
                dailyStats.updates++;
                break;
                
            case 'MERGE':
                this.dashboardData.stats.mergeOps++;
                dailyStats.merges++;
                break;
                
            case 'CONFLICT':
                this.dashboardData.stats.conflictCount++;
                dailyStats.conflicts++;
                break;
                
            case 'FILE_ADD':
                this.dashboardData.stats.filesAdded++;
                this.dashboardData.stats.fileChanges++;
                dailyStats.files.added++;
                break;
                
            case 'FILE_MODIFY':
                this.dashboardData.stats.filesModified++;
                this.dashboardData.stats.fileChanges++;
                dailyStats.files.modified++;
                break;
                
            case 'FILE_DELETE':
                this.dashboardData.stats.fileChanges++;
                dailyStats.files.deleted++;
                break;
                
            case 'CHECKOUT':
                // Update existing branch or note if branch not in config
                if (metadata.branchPath) {
                    const branch = this.dashboardData.branches.find(b => 
                        b.svnPath === metadata.branchPath || 
                        metadata.branchPath.includes(b.name) ||
                        b.svnPath.includes(metadata.branchPath)
                    );
                    if (branch) {
                        branch.lastActivity = new Date().toLocaleDateString();
                        this.io.emit('svn-branches-update', this.dashboardData.branches);
                    }
                }
                break;
        }
        
        this.calculateDailyChanges();
    }

    calculateDailyChanges() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const todayStats = this.dashboardData.dailyStats[todayStr] || { commits: 0 };
        const yesterdayStats = this.dashboardData.dailyStats[yesterdayStr] || { commits: 0 };
        
        if (yesterdayStats.commits > 0) {
            this.dashboardData.stats.commitChange = Math.round(
                ((todayStats.commits - yesterdayStats.commits) / yesterdayStats.commits) * 100
            );
        }
        
        this.dashboardData.stats.branchChange = todayStats.commits || 0;
    }

    async updateBranchStats() {
        try {
            // Emit updated branch data
            this.io.emit('svn-branches-update', this.dashboardData.branches);
            this.logger.debug('Updated branch statistics');
        } catch (error) {
            this.logger.error('Error updating branch stats:', error);
        }
    }

    /**
     * Handle socket events for SVN dashboard
     */
    setupSocketHandlers(socket) {
        socket.on('request-svn-stats', () => {
            this.calculateDailyChanges();
            socket.emit('svn-stats-update', this.dashboardData.stats);
        });
        
        socket.on('request-svn-branches', () => {
            socket.emit('svn-branches-update', this.dashboardData.branches);
        });
        
        socket.on('request-svn-activities', () => {
            // Send recent activities
            const recentActivities = this.dashboardData.activities.slice(0, 20);
            recentActivities.forEach(activity => {
                socket.emit('svn-activity-update', activity);
            });
        });
        
        socket.on('request-svn-heatmap', () => {
            socket.emit('svn-heatmap-update', this.dashboardData.heatmapData);
        });
    }

    /**
     * Track commits from commit operations
     */
    trackCommit(revision, message, files, branchPath) {
        this.trackActivity('COMMIT', `Committed revision ${revision}: ${message}`, {
            revision,
            files,
            branchPath,
            branchName: this.extractBranchName(branchPath)
        });
    }

    /**
     * Track file changes from status operations
     */
    trackFileChanges(changes) {
        changes.forEach(change => {
            if (change.wcStatus === 'added') {
                this.trackActivity('FILE_ADD', `Added ${change.path}`);
            } else if (change.wcStatus === 'modified') {
                this.trackActivity('FILE_MODIFY', `Modified ${change.path}`);
            } else if (change.wcStatus === 'deleted') {
                this.trackActivity('FILE_DELETE', `Deleted ${change.path}`);
            } else if (change.wcStatus === 'conflicted') {
                this.trackActivity('CONFLICT', `Conflict detected in ${change.path}`);
            }
        });
    }

    /**
     * Track updates
     */
    trackUpdate(branchPath, revision) {
        this.trackActivity('UPDATE', `Updated ${this.extractBranchName(branchPath)} to revision ${revision}`, {
            branchPath,
            revision,
            branchName: this.extractBranchName(branchPath)
        });
    }

    /**
     * Track merges
     */
    trackMerge(sourceBranch, targetBranch) {
        this.trackActivity('MERGE', `Merged ${sourceBranch} into ${targetBranch}`, {
            sourceBranch,
            targetBranch
        });
    }

    /**
     * Track checkouts
     */
    trackCheckout(url, branchPath) {
        const branchName = this.extractBranchName(url);
        this.trackActivity('CHECKOUT', `Checked out ${branchName}`, {
            url,
            branchPath,
            branchName
        });
    }

    extractBranchName(path) {
        if (!path) return 'unknown';
        
        // Extract branch name from SVN path
        const parts = path.split('/');
        
        // Look for common SVN patterns
        const branchIndex = parts.findIndex(part => part === 'branches');
        if (branchIndex !== -1 && parts[branchIndex + 1]) {
            return parts[branchIndex + 1];
        }
        
        // Look for trunk
        if (parts.includes('trunk')) {
            return 'trunk';
        }
        
        // Fallback to last directory
        return parts[parts.length - 1] || 'unknown';
    }

    /**
     * Get dashboard data for API endpoints
     */
    getDashboardData() {
        return {
            ...this.dashboardData,
            lastUpdated: new Date()
        };
    }

    /**
     * Cleanup
     */
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        // Save data one final time
        this.saveMonitoringData().catch(error => {
            this.logger.error('Error saving monitoring data during cleanup:', error);
        });
    }
}
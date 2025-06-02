import express from "express";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup Express routes and middleware
 * @param {express.Application} app - Express app instance
 * @param {Object} options - Configuration options
 * @param {boolean} options.isDev - Development mode flag
 * @param {string} options.latestVersion - Latest version string
 * @param {Object} options.performanceMonitor - Performance monitor instance
 * @param {Object} options.svnManager - SVN manager instance
 * @param {Object} options.socketManager - Socket manager instance
 * @param {Object} options.fileWatcher - File watcher instance
 * @param {Object} options.logger - Logger instance
 */
export function setupRoutes(app, options) {
    const { isDev, latestVersion, performanceMonitor, svnManager, socketManager, fileWatcher, logger } = options;

    // Use compression middleware for better performance
    app.use(compression({
        level: 6, // Balance between speed and compression
        threshold: 1024, // Only compress responses > 1KB
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        }
    }));

    // Fix MIME types for JS, CSS
    app.use((req, res, next) => {
        if (req.url.endsWith(".js")) {
            res.type("application/javascript");
        } else if (req.url.endsWith(".css")) {
            res.type("text/css");
        }
        next();
    });

    // Serve static files with optimized caching
    const staticOptions = {
        maxAge: isDev ? 0 : '1d',
        etag: true,
        lastModified: true,
        setHeaders: (res, path) => {
            if (path.endsWith(".js")) {
                res.setHeader("Content-Type", "application/javascript");
            } else if (path.endsWith(".css")) {
                res.setHeader("Content-Type", "text/css");
            }

            // Enable caching for static assets in production
            if (!isDev) {
                res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
            }
        }
    };

    app.use(express.static(path.join(__dirname, "../dist"), staticOptions));

    // Performance monitoring routes
    
    // Serve monitoring tools index
    app.get("/monitor", (req, res) => {
        res.sendFile(path.join(__dirname, "monitor-index.html"));
    });

    // Serve health check page
    app.get("/health", (req, res) => {
        res.sendFile(path.join(__dirname, "health-check.html"));
    });

    // Serve performance dashboard
    app.get("/performance", (req, res) => {
        res.sendFile(path.join(__dirname, "performance-dashboard.html"));
    });

    // Serve SVN dashboard
    app.get("/svn-dashboard", (req, res) => {
        res.sendFile(path.join(__dirname, "svn-dashboard.html"));
    });

    // API endpoint for health check
    app.get("/api/health", (req, res) => {
        res.json({
            status: "healthy",
            version: latestVersion,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    // API endpoint for performance metrics
    app.get("/api/performance", (req, res) => {
        const metrics = {
            server: performanceMonitor.getMetrics(),
            svn: svnManager.getPerformanceMetrics(),
            sockets: socketManager.getMetrics(),
            fileWatcher: fileWatcher.getStats(),
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            health: {
                status: "healthy",
                version: latestVersion
            }
        };
        res.json(metrics);
    });

    // Catch-all route for your React app
    app.get("*", (req, res) => {
        logger.debug(`Serving index.html for path: ${req.path}`);
        res.sendFile(path.join(__dirname, "../dist/index.html"));
    });
}
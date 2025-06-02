import { parentPort } from "worker_threads";
import { initialiseServer } from "../server/server.mjs";

let serverInstance = null;
let ioInstance = null;

async function startWorker() {
    try {
        console.log("Worker thread: Initializing server...");
        
        // Set up message handler for communication with main thread
        parentPort.on("message", (message) => {
            if (message.type === "shutdown") {
                console.log("Worker thread: Received shutdown signal");
                
                // Graceful shutdown
                if (serverInstance) {
                    serverInstance.close(() => {
                        console.log("HTTP server closed.");
                        if (ioInstance) {
                            ioInstance.close(() => {
                                console.log("Socket.IO connections closed.");
                                parentPort.postMessage({ type: "shutdown-complete" });
                                process.exit(0);
                            });
                        } else {
                            parentPort.postMessage({ type: "shutdown-complete" });
                            process.exit(0);
                        }
                    });
                    
                    // Force shutdown after 5 seconds
                    setTimeout(() => {
                        console.error("Forced shutdown after timeout");
                        process.exit(1);
                    }, 5000);
                } else {
                    process.exit(0);
                }
            }
        });

        // Initialize the server
        const { server, io } = await initialiseServer();
        serverInstance = server;
        ioInstance = io;
        
        // The server will send a "server-ready" message when it's ready
        // (handled by the sendToParent function in server.mjs)
        
    } catch (error) {
        console.error("Worker thread initialization error:", error);
        parentPort.postMessage({ type: "error", error: error.message });
        process.exit(1);
    }
}

// Handle any uncaught errors in the worker
process.on("uncaughtException", (error) => {
    console.error("Worker thread uncaught exception:", error);
    parentPort.postMessage({ type: "error", error: error.message });
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Worker thread unhandled rejection at:", promise, "reason:", reason);
    parentPort.postMessage({ type: "error", error: reason });
});

// Start the worker
startWorker();
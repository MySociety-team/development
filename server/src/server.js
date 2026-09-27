import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
  override: true
});
import dns from "node:dns";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";

import { startMaintenanceScheduler } from "./modules/maintenance/maintenance.scheduler.js";
import { startSpecialCollectionScheduler } from "./modules/specialCollections/specialCollection.scheduler.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDatabase();

    // ---------------------------------------------------
    // Start maintenance background scheduler
    // ---------------------------------------------------

    startMaintenanceScheduler();
    startSpecialCollectionScheduler();

    const server = app.listen(port, () => {
      console.log(`MySociety API running on http://localhost:${port}`);
    });

    function shutdown(signal) {
      console.log(`${signal} received. Shutting down gracefully.`);

      server.close(() => {
        console.log("HTTP server closed");

        process.exit(0);
      });
    }

    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Unable to start server:", error.message);

    process.exit(1);
  }
}

startServer();

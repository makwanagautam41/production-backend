import app from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/db";
import { connectRedis } from "./src/config/redis";

const port = config.port;

connectDB();
connectRedis();

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const shutdown = () => {
  console.log("Gracefully shutting down...");
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

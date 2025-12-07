import app from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/db";
import { connectRedis } from "./src/config/redis";

const startServer = () => {
  const port = config.port || 5513;

  connectDB();
  connectRedis();

  app.listen(port, () => {
    console.log(`Listning on port ${port} and url : http://localhost:${port}`);
  });
};

startServer();

import Redis from "ioredis";
import { config } from "./config";

let redis: Redis | null = null;

export const connectRedis = () => {
  if (redis) return redis;

  redis = new Redis({
    host: config.redis.host!,
    port: Number(config.redis.port),
    ...(config.redis.password ? { password: config.redis.password } : {}),
  });

  redis.on("connect", () => {
    console.log("Redis connected successfully");
  });

  redis.on("error", (err) => {
    console.error("Redis connection error:", err);
  });

  return redis;
};

export { redis };

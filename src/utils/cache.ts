import { connectRedis } from "../config/redis";

const redis = connectRedis();

export const cache = {
  async get(key: string) {
    const data = await redis.get(key);

    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: any, ttlSeconds = 3600) {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async del(key: string) {
    await redis.del(key);
  },
};

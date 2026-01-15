import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config(); // Force load here so imports don't break it

const url = process.env.REDIS_URL;

if (!url) {
  console.error("ERROR: REDIS_URL is not defined in .env");
  process.exit(1);
}

export const redisClient = createClient({
  url: url
});

redisClient.on('error', (err) => {
  console.log('Redis Error:', err.message);
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("✅ Redis Cloud Connected");
    }
  } catch (error) {
    console.error("❌ Redis Connection Failed:", error);
  }
};
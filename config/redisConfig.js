require('dotenv').config();
const Redis = require("ioredis");

// Use environment variable or fallback
const redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

redisClient.on("error", (err) => {
    console.error("❌ Redis Error:", err);
});

redisClient.on("connect", () => {
    console.log("✅ Redis Client Connected Successfully!");
    console.log(`🔗 Redis Run on.. http://${process.env.REDIS_URL}`);
});

redisClient.on("ready", () => {
    console.log("🚀 Redis is Ready to Use!");
});

// No need for explicit `redisClient.connect();` in ioredis

module.exports = redisClient;

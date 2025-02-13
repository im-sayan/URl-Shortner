const redis = require('redis');

const redisClient = redis.createClient({
    host: '127.0.0.1',
    port: 6379
});

redisClient.on('error', (err) => {
    console.error("❌ Redis Error:", err);
});

redisClient.on('connect', () => {
    console.log("✅ Redis Client Connected Successfully!");
});

redisClient.on('ready', () => {
    console.log("Redis is Ready to Use..🚀");
});

redisClient.connect();

module.exports = redisClient;

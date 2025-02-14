


const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: '9HQlItz6bvn32uL957lI0kcD03HOz0bw',
    socket: {
        host: 'redis-17005.c232.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 17005
    }
});

// const redisClient = createClient({
    //     socket: {
    //         host:"127.0.0.1",
    //         port:"6379"
            
    //     }
    // });

redisClient.on('error', err => console.log('Redis Client Error', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Redis connected successfully');
        console.log("🚀 Redis is Ready to Use!");
    } catch (error) {
        console.error('❌ Redis connection error:', error);
    }
})();

module.exports = redisClient;

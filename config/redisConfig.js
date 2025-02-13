const {createClient} = require('redis')

async function connectRedis() {
    const client = createClient({
        username: 'default',
        password: '9HQlItz6bvn32uL957lI0kcD03HOz0bw',
        socket: {
            host: 'redis-17005.c232.us-east-1-2.ec2.redns.redis-cloud.com', // Ensure correct host
            port: 17005
        }
    });

    // const client = createClient({
    //     socket: {
    //         host:"127.0.0.1",
    //         port:"6379"
            
    //     }
    // });
    

    client.on('error', err => console.log('Redis Client Error', err));

    try {
        await client.connect();
        console.log('✅ Redis connected successfully');
    
        await client.set('foo', 'bar');
        const result = await client.get('foo');
        
        console.log('🔹 Retrieved value from Redis:', result); // >>> bar
        console.log("🚀 Redis is Ready to Use!");
    } catch (error) {
        console.error('❌ Redis connection error:', error);
    }
    
}

connectRedis();

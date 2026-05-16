const Redis = require('ioredis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    // If Redis is not connected, backend should not crash
    return Math.min(times * 50, 2000);
  }
};

const redis = new Redis(redisConfig);

redis.on('error', (err) => {
  console.warn('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

module.exports = redis;
module.exports.redisConfig = redisConfig;

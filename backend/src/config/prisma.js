require('dotenv').config();

const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');

neonConfig.webSocketConstructor = WebSocket;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__projectflowPrisma ||
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__projectflowPrisma = prisma;
}

module.exports = prisma;

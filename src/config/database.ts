import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from './environment';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create connection pool with SSL for production
const connectionString = env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || 
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// import { PrismaClient } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { Pool } from 'pg';
// import { env } from './environment';

// const globalForPrisma = global as unknown as { prisma: PrismaClient };

// const connectionString = env.DATABASE_URL;
// const pool = new Pool({ connectionString });
// const adapter = new PrismaPg(pool);

// export const prisma = globalForPrisma.prisma || 
//   new PrismaClient({
//     adapter,
//     log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
//   });

// if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// export default prisma;
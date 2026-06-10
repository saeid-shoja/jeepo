import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/** Dummy URL for `prisma generate` when DATABASE_URL is unset (e.g. Vercel web deploy). */
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/jeepo?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: DATABASE_URL,
  },
});

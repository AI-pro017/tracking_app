import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_cSv5poqU7DlJ@ep-winter-pine-aecc6dub-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
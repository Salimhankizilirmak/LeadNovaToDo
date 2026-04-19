import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/**
 * Turso / LibSQL Veritabanı Bağlantısı
 */

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.warn('TURSO_DATABASE_URL veya TURSO_AUTH_TOKEN eksik. Veritabanı sorguları hata verebilir.');
}

const client = createClient({
  url: url || '',
  authToken: authToken || '',
});

export const db = drizzle(client, { schema });

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const { Pool } = pg;

async function deleteUserByEmail(targetEmail) {
  const email = (targetEmail || process.argv[2] || 'alvanpeter29@gmail.com').trim().toLowerCase();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set in backend/.env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : false
  });

  try {
    console.log(`🔍 Searching for user with email: ${email}...`);
    const check = await pool.query('SELECT id, name, email, phone, role FROM users WHERE LOWER(email) = $1;', [email]);

    if (check.rows.length === 0) {
      console.log(`ℹ️ No user found in the database with email "${email}".`);
      return;
    }

    const user = check.rows[0];
    console.log(`👤 Found user:`, user);

    console.log(`🗑️ Deleting user ${user.id} (${user.email})...`);
    const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email;', [user.id]);

    console.log(`✅ Successfully deleted user from database:`, res.rows[0]);
  } catch (err) {
    console.error('❌ Failed to delete user:', err.message);
  } finally {
    await pool.end();
  }
}

const target = process.argv[2] || 'alvanpeter29@gmail.com';
deleteUserByEmail(target);

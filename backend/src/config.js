import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load backend/.env first (relative to this file)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Also load root .env if present (without overwriting already set variables)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'rommie-super-secure-jwt-secret-min-32-chars-long!',
  cookieSecret: process.env.COOKIE_SECRET || 'rommie-super-secure-cookie-secret-min-32-chars-long!',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  brevoApiKey: process.env.BREVO_API_KEY || process.env.EMAIL_API_KEY || 'mock-key',
  emailApiKey: process.env.BREVO_API_KEY || process.env.EMAIL_API_KEY || 'mock-key',
  emailFrom: process.env.EMAIL_FROM || 'alerts@rommie.co.ke',
  emailFromName: process.env.EMAIL_FROM_NAME || 'Rommie',
  googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback',

  // Cloudflare S3-compatible R2 Storage
  r2AccountId: process.env.R2_ACCOUNT_ID || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || 'rommie-media',
  r2PublicUrl: (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || (process.env.R2_ACCOUNT_ID ? `https://pub-${process.env.R2_ACCOUNT_ID.slice(0, 8)}.r2.dev` : 'https://cdn.rommie.co.ke')).replace(/\/+$/, ''),
  r2Endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '')
};

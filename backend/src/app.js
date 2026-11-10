import dns from 'node:dns';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import sensible from '@fastify/sensible';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import { config } from './config.js';
import { db } from './db/db.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/auth.routes.js';
import roomsRoutes from './routes/rooms.routes.js';
import mediaRoutes from './routes/media.routes.js';
import savedRoutes from './routes/saved.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import caretakersRoutes from './routes/caretakers.routes.js';

export async function buildApp(options = {}) {
  const fastify = Fastify({
    logger: options.logger ?? false
  });

  // 1. Core Plugins
  await fastify.register(sensible);

  const rawOrigin = options.corsOrigin || config.corsOrigin || 'http://localhost:5173';
  const configuredOrigins = rawOrigin.split(',').map((o) => o.trim());

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return cb(null, true);
      if (
        configuredOrigins.includes(origin) ||
        origin.endsWith('.ngrok-free.dev') ||
        origin.endsWith('.ngrok.app') ||
        origin.endsWith('.ngrok-free.app') ||
        origin.includes('localhost')
      ) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true
  });
  await fastify.register(cookie, {
    secret: config.cookieSecret
  });
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });
  await fastify.register(jwt, {
    secret: config.jwtSecret
  });
  await fastify.register(multipart, {
    limits: {
      fileSize: 8 * 1024 * 1024 // 8 MB max
    }
  });

  // 2. Authentication Decorators
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      let token = null;
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else if (request.cookies && request.cookies.rommie_token) {
        token = request.cookies.rommie_token;
      }

      if (!token) {
        return reply.status(401).send({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication token required.',
            field: null,
            details: []
          }
        });
      }

      const decoded = fastify.jwt.verify(token);
      request.user = decoded;

      let user = await db.findUserById(decoded.sub || decoded.id);
      if (!user && decoded.email) {
        user = await db.findUserByEmail(decoded.email);
      }

      if (user) {
        request.user = {
          ...decoded,
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: Boolean(user.emailVerified),
          isSuspended: Boolean(user.isSuspended)
        };
      } else if (decoded.email || decoded.sub || decoded.id) {
        // Auto-provision user in PostgreSQL if missing so foreign key constraints succeed
        try {
          const autoId = decoded.sub || decoded.id;
          user = await db.createUser({
            id: autoId,
            email: decoded.email || `${autoId}@user.rommie.co.ke`,
            name: decoded.name || 'Rommie User',
            role: decoded.role || 'student',
            emailVerified: Boolean(decoded.emailVerified ?? true),
            isGoogle: Boolean(decoded.isGoogle ?? true)
          });
          request.user = {
            ...decoded,
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: Boolean(user.emailVerified),
            isSuspended: Boolean(user.isSuspended)
          };
        } catch (e) {
          const retryUser = decoded.email ? await db.findUserByEmail(decoded.email) : null;
          if (retryUser) {
            request.user = {
              ...decoded,
              id: retryUser.id,
              email: retryUser.email,
              name: retryUser.name,
              role: retryUser.role,
              emailVerified: Boolean(retryUser.emailVerified),
              isSuspended: Boolean(retryUser.isSuspended)
            };
          }
        }
      }
    } catch (err) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid or expired session token.',
          field: null,
          details: []
        }
      });
    }
  });

  fastify.decorate('requireRole', function (...roles) {
    return async function (request, reply) {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required.',
            field: null,
            details: []
          }
        });
      }
      if (!roles.includes(request.user.role)) {
        return reply.status(403).send({
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Requires one of: [${roles.join(', ')}]`,
            field: null,
            details: []
          }
        });
      }
    };
  });

  const emailVerifiedHook = async function (request, reply) {
    if (!request.user || !request.user.emailVerified) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Email verification required',
          field: 'emailVerified',
          details: []
        }
      });
    }
  };

  fastify.decorate('requireEmailVerified', function (req, rep) {
    if (req && rep && req.headers) {
      return emailVerifiedHook(req, rep);
    }
    return emailVerifiedHook;
  });

  // 3. Global Error Handler
  fastify.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    const errorCode =
      error.code ||
      (statusCode === 400
        ? 'BAD_REQUEST'
        : statusCode === 401
        ? 'UNAUTHENTICATED'
        : statusCode === 403
        ? 'FORBIDDEN'
        : statusCode === 404
        ? 'NOT_FOUND'
        : statusCode === 409
        ? 'CONFLICT'
        : statusCode === 422
        ? 'UNPROCESSABLE_ENTITY'
        : statusCode === 429
        ? 'RATE_LIMITED'
        : 'INTERNAL_ERROR');

    reply.status(statusCode).send({
      error: {
        code: errorCode,
        message: error.message || 'An unexpected error occurred.',
        field: error.field || null,
        details: error.details || []
      }
    });
  });

  // 4. Register Route Domains
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(roomsRoutes, { prefix: '/api/v1/rooms' });
  await fastify.register(mediaRoutes, { prefix: '/api/v1/media' });
  await fastify.register(savedRoutes, { prefix: '/api/v1/saved' });
  await fastify.register(alertsRoutes, { prefix: '/api/v1/alerts' });
  await fastify.register(reportsRoutes, { prefix: '/api/v1/reports' });
  await fastify.register(verificationRoutes, { prefix: '/api/v1/verification' });
  await fastify.register(adminRoutes, { prefix: '/api/v1/admin' });
  await fastify.register(caretakersRoutes, { prefix: '/api/v1/caretakers' });

  // 5. Health Check
  fastify.get('/api/v1/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }));

  // 6. Seed in-memory DB if needed
  if (options.seed !== false) {
    if (db.state.users.size === 0 || options.forceSeed) {
      await seedDatabase(db);
    }
  }

  return fastify;
}

export default buildApp;

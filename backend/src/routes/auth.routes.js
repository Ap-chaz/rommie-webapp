import { authService } from '../services/auth.service.js';
import { config } from '../config.js';

export default async function authRoutes(fastify, opts) {
  // 1. Sign up
  fastify.post('/signup', async (request, reply) => {
    const { user, token } = await authService.signup(
      request.body || {},
      request.ip,
      (payload) => fastify.jwt.sign(payload)
    );

    if (token) {
      reply.setCookie('rommie_token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60
      });
    }

    reply.status(201).send({ token, user });
  });

  // 2. Login
  fastify.post('/login', async (request, reply) => {
    const { user, token } = await authService.login(
      request.body || {},
      (payload) => fastify.jwt.sign(payload)
    );

    if (token) {
      reply.setCookie('rommie_token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60
      });
    }

    reply.status(200).send({ token, user });
  });

  // 3. Google Login & OAuth
  fastify.get('/google/url', async (request, reply) => {
    const role = request.query?.role || 'student';
    const redirect = request.query?.redirect || '';
    const redirectUri = request.query?.redirectUri;
    const clientId = request.query?.clientId;
    const url = authService.getGoogleAuthUrl({ role, redirect, redirectUri, clientId });
    reply.status(200).send({ url });
  });

  fastify.post('/google/callback', async (request, reply) => {
    const { code, role, redirectUri } = request.body || {};
    const { user, token } = await authService.handleGoogleOAuthCode(
      { code, role, redirectUri },
      role,
      redirectUri,
      (payload) => fastify.jwt.sign(payload)
    );

    if (token) {
      reply.setCookie('rommie_token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60
      });
    }

    reply.status(200).send({ token, user });
  });

  fastify.post('/google', async (request, reply) => {
    const body = request.body || {};
    let result;
    if (body.code) {
      result = await authService.handleGoogleOAuthCode(
        body,
        body.role,
        body.redirectUri,
        (payload) => fastify.jwt.sign(payload)
      );
    } else {
      result = await authService.loginWithGoogle(
        body,
        (payload) => fastify.jwt.sign(payload)
      );
    }

    const { user, token } = result;

    if (token) {
      reply.setCookie('rommie_token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60
      });
    }

    reply.status(200).send({ token, user });
  });

  // 4. Send Email OTP
  fastify.post('/otp/send', async (request, reply) => {
    const result = await authService.sendOtp(request.body?.email, request.ip);
    reply.status(200).send(result);
  });

  // 5. Verify Email OTP
  fastify.post('/otp/verify', async (request, reply) => {
    const result = await authService.verifyOtp(request.body?.email, request.body?.code);
    reply.status(200).send(result);
  });

  // 6. Login with Phone & OTP
  fastify.post('/otp/login', async (request, reply) => {
    const { user, token } = await authService.loginWithOtp(
      request.body || {},
      (payload) => fastify.jwt.sign(payload)
    );

    if (token) {
      reply.setCookie('rommie_token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60
      });
    }

    reply.status(200).send({ token, user });
  });

  // 7. Get Current Session
  fastify.get('/session', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await authService.getSession(request.user.id);
    reply.status(200).send({ user });
  });

  // 8. Logout
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('rommie_token', { path: '/' });
    reply.status(200).send({ success: true });
  });

  // 9. Update Phone
  fastify.patch('/phone', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await authService.updatePhone(request.user.id, request.body?.phone);
    reply.status(200).send({ ...user, user });
  });
}

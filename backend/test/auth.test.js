import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/db.js';

describe('Auth & App Scaffolding Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp({ seed: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoint', () => {
    it('GET /api/v1/health returns ok', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/health'
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('User Signup (POST /api/v1/auth/signup)', () => {
    it('registers a new student user successfully', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: {
          email: 'student.test@cuea.edu',
          password: 'Password123!',
          name: 'Faith Achieng',
          role: 'student',
          school: 'CUEA',
          phone: '+254711999888'
        }
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.token).toBeDefined();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('student.test@cuea.edu');
      expect(body.user.role).toBe('student');
      expect(body.user.emailVerified).toBe(false);
      expect(body.user.passwordHash).toBeUndefined();

      // Check cookie
      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain('rommie_token=');
    });

    it('rejects signup with duplicate email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: {
          email: 'student.test@cuea.edu',
          password: 'Password123!',
          name: 'Faith Achieng Duplicate',
          phone: '+254711999889'
        }
      });

      expect(res.statusCode).toBe(409);
      const body = res.json();
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('EMAIL_EXISTS');
    });

    it('rejects signup with invalid email format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: {
          email: 'not-an-email',
          password: 'Password123!',
          name: 'Invalid Email User'
        }
      });

      expect(res.statusCode).toBe(422);
      const body = res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.field).toBe('email');
    });

    it('registers a new caretaker and creates caretaker record in db', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: {
          email: 'caretaker.new@example.com',
          password: 'Password123!',
          name: 'James Mwangi',
          role: 'caretaker',
          phone: '+254712000111'
        }
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.user.role).toBe('caretaker');

      const caretaker = await db.findCaretakerById(body.user.id);
      expect(caretaker).toBeDefined();
      expect(caretaker.name).toBe('James Mwangi');
    });
  });

  describe('User Login (POST /api/v1/auth/login)', () => {
    it('authenticates seeded student successfully', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'kevin@cuea.edu',
          password: 'student123'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.token).toBeDefined();
      expect(body.user.email).toBe('kevin@cuea.edu');
      expect(body.user.role).toBe('student');
    });

    it('rejects login with invalid password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'kevin@cuea.edu',
          password: 'wrongpassword'
        }
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects login for non-existent email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nobody@nowhere.com',
          password: 'somepassword'
        }
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('blocks login for suspended caretaker', async () => {
      // Suspend caretaker muthoni
      await db.updateCaretaker('c-muthoni', { isSuspended: true });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'muthoni@example.com',
          password: 'caretaker123'
        }
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.error.code).toBe('ACCOUNT_SUSPENDED');

      // Unsuspend for other tests
      await db.updateCaretaker('c-muthoni', { isSuspended: false });
    });
  });

  describe('Google Authentication (POST /api/v1/auth/google)', () => {
    it('provisions new user via Google login', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google',
        payload: {
          email: 'google.student@gmail.com',
          name: 'Google Student',
          role: 'student'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.token).toBeDefined();
      expect(body.user.email).toBe('google.student@gmail.com');
      expect(body.user.emailVerified).toBe(true);
      expect(body.user.isGoogle).toBe(true);
    });

    it('authenticates existing user via Google login', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google',
        payload: {
          email: 'google.student@gmail.com'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.email).toBe('google.student@gmail.com');
    });

    it('provisions new caretaker via Google login and creates caretaker record', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google',
        payload: {
          email: 'google.caretaker@gmail.com',
          name: 'Google Caretaker',
          role: 'caretaker'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.role).toBe('caretaker');
      expect(body.user.emailVerified).toBe(true);
      expect(body.user.isGoogle).toBe(true);

      const ct = await db.findCaretakerById(body.user.id);
      expect(ct).toBeDefined();
      expect(ct.name).toBe('Google Caretaker');
    });

    it('authenticates and provisions user using idToken exchange', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        email: 'gis.token.user@gmail.com',
        name: 'GIS Token User',
        given_name: 'GIS',
        family_name: 'User',
        email_verified: true
      })).toString('base64url');
      const fakeIdToken = `${header}.${payload}.signature`;

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google',
        payload: {
          idToken: fakeIdToken,
          role: 'student'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.email).toBe('gis.token.user@gmail.com');
      expect(body.user.name).toBe('GIS Token User');
      expect(body.user.firstName).toBe('GIS');
      expect(body.user.lastName).toBe('User');
      expect(body.user.emailVerified).toBe(true);
      expect(body.user.isGoogle).toBe(true);
    });

    it('blocks suspended caretaker from logging in via Google', async () => {
      const ctUser = await db.createUser({
        email: 'suspended.ct@gmail.com',
        name: 'Suspended CT',
        role: 'caretaker',
        emailVerified: true,
        isGoogle: true
      });
      await db.createCaretaker({
        id: ctUser.id,
        name: ctUser.name,
        phone: '',
        isVerified: false,
        isSuspended: true
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google',
        payload: {
          email: 'suspended.ct@gmail.com',
          role: 'caretaker'
        }
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.error.code).toBe('ACCOUNT_SUSPENDED');
      expect(body.error.message).toContain('suspended');
    });

    it('marks previously unverified user as emailVerified=true upon Google login', async () => {
      await db.createUser({
        email: 'unverified.existing@gmail.com',
        name: 'Existing Unverified',
        role: 'student',
        emailVerified: false,
        isGoogle: false
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google',
        payload: {
          email: 'unverified.existing@gmail.com'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.emailVerified).toBe(true);

      const dbUser = await db.findUserByEmail('unverified.existing@gmail.com');
      expect(dbUser.emailVerified).toBe(true);
      expect(dbUser.isGoogle).toBe(true);
    });

    it('GET /api/v1/auth/google/url returns valid Google OAuth 2.0 authorization URL', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/google/url?role=caretaker&redirect=/caretaker/post'
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.url).toBeDefined();
      expect(body.url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(body.url).toContain('response_type=code');
      expect(body.url).toContain('scope=openid');
      expect(body.url).toContain(encodeURIComponent(JSON.stringify({ role: 'caretaker', redirect: '/caretaker/post' })));
    });

    it('POST /api/v1/auth/google/callback successfully exchanges authorization code for student', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google/callback',
        payload: {
          code: 'mock_code_student.oauth@gmail.com_Grace Wanjiru',
          role: 'student'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.token).toBeDefined();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('student.oauth@gmail.com');
      expect(body.user.name).toBe('Grace Wanjiru');
      expect(body.user.role).toBe('student');
      expect(body.user.emailVerified).toBe(true);
      expect(body.user.isGoogle).toBe(true);

      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain('rommie_token=');
    });

    it('POST /api/v1/auth/google/callback provisions caretaker and caretaker record', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google/callback',
        payload: {
          code: 'mock_code_caretaker.oauth@gmail.com_John Kamau',
          role: 'caretaker'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.role).toBe('caretaker');
      expect(body.user.email).toBe('caretaker.oauth@gmail.com');
      expect(body.user.emailVerified).toBe(true);

      const ct = await db.findCaretakerById(body.user.id);
      expect(ct).toBeDefined();
      expect(ct.name).toBe('John Kamau');
    });

    it('POST /api/v1/auth/google supports authorization code in payload', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google',
        payload: {
          code: 'mock_code_code.payload@gmail.com_Code User',
          role: 'student'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.email).toBe('code.payload@gmail.com');
      expect(body.token).toBeDefined();
    });

    it('POST /api/v1/auth/google/callback returns 400 when code is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google/callback',
        payload: {
          role: 'student'
        }
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.error.code).toBe('MISSING_CODE');
    });

    it('rejects Google login with invalid email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/google',
        payload: {
          email: 'not-valid-email'
        }
      });

      expect(res.statusCode).toBe(422);
      const body = res.json();
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(body.error.field).toBe('email');
    });
  });

  describe('OTP Generation, Verification & Rate Limits', () => {
    const testEmail = 'otp.user@example.com';

    it('sends OTP code to valid email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/otp/send',
        payload: { email: testEmail }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.expiresInSeconds).toBe(300);
      expect(body.cooldownSeconds).toBe(60);
      expect(body.code).toBeDefined();
    });

    it('enforces 60-second cooldown on consecutive requests', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/otp/send',
        payload: { email: testEmail }
      });

      expect(res.statusCode).toBe(429);
      const body = res.json();
      expect(body.error.code).toBe('RATE_LIMITED');
      expect(body.error.message).toContain('Please wait');
    });

    it('rejects incorrect OTP code', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/otp/verify',
        payload: {
          email: testEmail,
          code: '000000'
        }
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.error.code).toBe('OTP_INVALID');
    });

    it('verifies correct OTP code and updates user emailVerified', async () => {
      // First create a user with that email
      await db.createUser({
        email: testEmail,
        name: 'OTP User',
        role: 'student',
        emailVerified: false
      });

      // Get the latest OTP generated
      const latestOtp = await db.getLatestEmailOtp(testEmail);
      expect(latestOtp).toBeDefined();

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/otp/verify',
        payload: {
          email: testEmail,
          code: latestOtp.code
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.ok).toBe(true);

      const user = await db.findUserByEmail(testEmail);
      expect(user.emailVerified).toBe(true);
    });

    it('supports login with phone and OTP', async () => {
      // Create user with phone
      await db.createUser({
        email: 'phone.otp@example.com',
        phone: '+254788112233',
        name: 'Phone User',
        role: 'student',
        emailVerified: false
      });

      // Mock OTP accepts '123456'
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/otp/login',
        payload: {
          phone: '+254788112233',
          code: '123456'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.token).toBeDefined();
      expect(body.user.phone).toBe('+254788112233');
      expect(body.user.emailVerified).toBe(true);
    });
  });

  describe('Session & JWT Security', () => {
    let studentToken;

    beforeAll(async () => {
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'kevin@cuea.edu',
          password: 'student123'
        }
      });
      studentToken = loginRes.json().token;
    });

    it('GET /api/v1/auth/session rejects requests without authentication', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/session'
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('GET /api/v1/auth/session rejects requests with invalid token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/session',
        headers: {
          authorization: 'Bearer bad.token.here'
        }
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('GET /api/v1/auth/session returns session with valid Bearer token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/session',
        headers: {
          authorization: `Bearer ${studentToken}`
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('kevin@cuea.edu');
      expect(body.user.role).toBe('student');
    });

    it('GET /api/v1/auth/session returns session with cookie rommie_token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/session',
        cookies: {
          rommie_token: studentToken
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('kevin@cuea.edu');
    });

    it('PATCH /api/v1/auth/phone updates phone for authenticated user', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/auth/phone',
        headers: {
          authorization: `Bearer ${studentToken}`
        },
        payload: {
          phone: '+254799887766'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.phone).toBe('+254799887766');

      // Verify db was updated
      const updatedUser = await db.findUserById('u-kevin');
      expect(updatedUser.phone).toBe('+254799887766');
    });

    it('POST /api/v1/auth/logout clears session cookie', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout'
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);

      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain('rommie_token=;');
    });
  });

  describe('Decorators: requireRole and requireEmailVerified', () => {
    it('blocks access if user role is not permitted', async () => {
      const testApp = await buildApp({ seed: false });
      testApp.get(
        '/test-admin-only',
        {
          preHandler: [testApp.authenticate, testApp.requireRole('admin')]
        },
        async () => ({ secret: 'top_secret' })
      );
      await testApp.ready();

      // Authenticate as student
      const token = testApp.jwt.sign({ sub: 'u-kevin', id: 'u-kevin', role: 'student' });

      const res = await testApp.inject({
        method: 'GET',
        url: '/test-admin-only',
        headers: { authorization: `Bearer ${token}` }
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('FORBIDDEN');
      expect(res.json().error.message).toContain('Access denied');
      await testApp.close();
    });

    it('blocks access if user email is not verified', async () => {
      const testApp = await buildApp({ seed: false });
      testApp.get(
        '/test-email-verified-only',
        {
          preHandler: [testApp.authenticate, testApp.requireEmailVerified()]
        },
        async () => ({ ok: true })
      );
      await testApp.ready();

      // Create an unverified user in db
      const unverifiedUser = await db.createUser({
        id: 'u-unverified-test',
        email: 'unverified@test.com',
        name: 'Unverified User',
        role: 'student',
        passwordHash: 'hash',
        emailVerified: false
      });

      const token = testApp.jwt.sign({ sub: unverifiedUser.id, id: unverifiedUser.id, role: 'student' });

      const res = await testApp.inject({
        method: 'GET',
        url: '/test-email-verified-only',
        headers: { authorization: `Bearer ${token}` }
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('FORBIDDEN');
      expect(res.json().error.message).toBe('Email verification required');
      await testApp.close();
    });
  });
});

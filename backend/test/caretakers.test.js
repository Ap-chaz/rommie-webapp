import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/db.js';

describe('Caretakers Profile & Listing Integration Suite', () => {
  let app;
  let muthoniToken;
  let kamauToken;
  let studentToken;
  let adminToken;

  beforeAll(async () => {
    app = await buildApp({ logger: false, seed: true });

    // Generate tokens for test users
    muthoniToken = app.jwt.sign({ sub: 'c-muthoni', role: 'caretaker' });
    kamauToken = app.jwt.sign({ sub: 'c-kamau', role: 'caretaker' });
    studentToken = app.jwt.sign({ sub: 'u-kevin', role: 'student' });
    adminToken = app.jwt.sign({ sub: 'u-admin-1', role: 'admin' });
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // 1. GET /api/v1/caretakers/profile (Self)
  // ==========================================
  describe('GET /api/v1/caretakers/profile', () => {
    it('returns 401 UNAUTHENTICATED when unauthenticated', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/profile'
      });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 FORBIDDEN when accessed by a student', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/profile',
        headers: { authorization: `Bearer ${studentToken}` }
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 with full profile for verified caretaker c-muthoni', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/profile',
        headers: { authorization: `Bearer ${muthoniToken}` }
      });
      expect(res.statusCode).toBe(200);
      const { data } = JSON.parse(res.payload);

      expect(data).toBeDefined();
      expect(data.caretaker).toBeDefined();
      expect(data.caretaker.id).toBe('c-muthoni');
      expect(data.caretaker.name).toBe('Faith Muthoni');
      expect(data.caretaker.phone).toBe('+254712345670');
      expect(data.caretaker.isVerified).toBe(true);
      expect(data.caretaker.verified).toBe(true);
      expect(typeof data.caretaker.trustScore).toBe('number');

      // Rooms
      expect(Array.isArray(data.rooms)).toBe(true);
      expect(data.rooms.length).toBeGreaterThan(0);
      expect(data.rooms.every((r) => r.caretakerId === 'c-muthoni')).toBe(true);

      // Trust score breakdown
      expect(data.trust).toBeDefined();
      expect(typeof data.trust.score).toBe('number');
      expect(Array.isArray(data.trust.items)).toBe(true);
      expect(data.trust.items.length).toBe(4);
      const totalPoints = data.trust.items.reduce((sum, item) => sum + item.points, 0);
      expect(data.trust.score).toBe(totalPoints);

      // Verification state
      expect(data.verification).toBeDefined();
      expect(data.verification.status).toBe('approved');
    });

    it('returns 200 with pending verification for c-kamau', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/profile',
        headers: { authorization: `Bearer ${kamauToken}` }
      });
      expect(res.statusCode).toBe(200);
      const { data } = JSON.parse(res.payload);

      expect(data.caretaker.id).toBe('c-kamau');
      expect(data.caretaker.verified).toBe(false);
      expect(data.verification.status).toBe('pending');
      expect(data.verification.request).toBeDefined();
      expect(data.verification.request.documentName).toBe('Peter Kamau - Kenyan National ID');
    });

    it('allows an admin to access the profile endpoint with synthesized profile', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/profile',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const { data } = JSON.parse(res.payload);
      expect(data.caretaker.id).toBe('u-admin-1');
      expect(Array.isArray(data.rooms)).toBe(true);
      expect(data.trust).toBeDefined();
    });
  });

  // ==========================================
  // 2. GET /api/v1/caretakers/:id (Public / By ID)
  // ==========================================
  describe('GET /api/v1/caretakers/:id', () => {
    it('returns 200 for public access to c-muthoni', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/c-muthoni'
      });
      expect(res.statusCode).toBe(200);
      const { data } = JSON.parse(res.payload);
      expect(data.caretaker.id).toBe('c-muthoni');
      expect(data.caretaker.name).toBe('Faith Muthoni');
      expect(data.rooms.length).toBeGreaterThan(0);
      expect(data.trust.score).toBeGreaterThan(0);
    });

    it('returns 200 for public access to c1', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/c1'
      });
      expect(res.statusCode).toBe(200);
      const { data } = JSON.parse(res.payload);
      expect(data.caretaker.id).toBe('c1');
      expect(data.caretaker.name).toBe('Mama Wanjiru');
    });

    it('returns 404 NOT_FOUND for non-existent caretaker ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/non-existent-caretaker-999'
      });
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('synthesizes caretaker profile if user exists without caretaker table entry', async () => {
      // Create user without caretaker record
      await db.createUser({
        id: 'u-synth-caretaker',
        email: 'synth@caretaker.com',
        phone: '+254799887766',
        name: 'Synthesized Caretaker',
        role: 'caretaker',
        emailVerified: true
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/u-synth-caretaker'
      });
      expect(res.statusCode).toBe(200);
      const { data } = JSON.parse(res.payload);
      expect(data.caretaker.id).toBe('u-synth-caretaker');
      expect(data.caretaker.name).toBe('Synthesized Caretaker');
      expect(data.caretaker.verified).toBe(false);
      expect(data.rooms).toEqual([]);
      expect(data.verification.status).toBe('none');
    });
  });

  // ==========================================
  // 3. Caretaker KYC Workflow Persistence
  // ==========================================
  describe('Caretaker KYC Verification Flow', () => {
    it('records document name and URL and persists to database', async () => {
      // Create a fresh caretaker user
      await db.createUser({
        id: 'c-kyc-test',
        email: 'kyc.test@caretaker.com',
        phone: '+254788112233',
        name: 'KYC Test Caretaker',
        role: 'caretaker',
        emailVerified: true
      });
      await db.createCaretaker({
        id: 'c-kyc-test',
        name: 'KYC Test Caretaker',
        phone: '+254788112233',
        isVerified: false,
        isSuspended: false
      });

      const token = app.jwt.sign({ sub: 'c-kyc-test', role: 'caretaker' });

      // Before submitting: verification status should be 'none'
      const preRes = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/profile',
        headers: { authorization: `Bearer ${token}` }
      });
      expect(preRes.statusCode).toBe(200);
      expect(JSON.parse(preRes.payload).data.verification.status).toBe('none');

      // Submit verification
      const submitRes = await app.inject({
        method: 'POST',
        url: '/api/v1/verification/caretaker',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          documentUrl: 'https://cdn.rommie.co.ke/kyc/national-id-front.jpg',
          documentName: 'Kenyan National ID (Front)'
        }
      });
      expect(submitRes.statusCode).toBe(201);
      const submitData = JSON.parse(submitRes.payload).data;
      expect(submitData.documentUrl).toBe('https://cdn.rommie.co.ke/kyc/national-id-front.jpg');
      expect(submitData.documentName).toBe('Kenyan National ID (Front)');
      expect(submitData.status).toBe('pending');

      // After submitting: profile reflects the pending request
      const postRes = await app.inject({
        method: 'GET',
        url: '/api/v1/caretakers/profile',
        headers: { authorization: `Bearer ${token}` }
      });
      expect(postRes.statusCode).toBe(200);
      const postData = JSON.parse(postRes.payload).data;
      expect(postData.verification.status).toBe('pending');
      expect(postData.verification.request.documentName).toBe('Kenyan National ID (Front)');
      expect(postData.verification.request.documentUrl).toBe('https://cdn.rommie.co.ke/kyc/national-id-front.jpg');
    });
  });
});

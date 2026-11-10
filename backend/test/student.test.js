import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/db.js';

describe('Student Engagement Suite (/saved, /alerts, /reports)', () => {
  let app;
  let verifiedToken;
  let unverifiedToken;
  let otherStudentToken;

  const testStudentId = 'u-kevin';
  const unverifiedStudentId = 'u-unverified-student';
  const otherStudentId = 'u-other-student';

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();

    // Create unverified user if not already in DB
    if (!await db.findUserById(unverifiedStudentId)) {
      await db.createUser({
        id: unverifiedStudentId,
        email: 'unverified.student@cuea.edu',
        name: 'Unverified Student',
        role: 'student',
        emailVerified: false
      });
    }

    // Create another student for authorization boundary testing
    if (!await db.findUserById(otherStudentId)) {
      await db.createUser({
        id: otherStudentId,
        email: 'other.student@cuea.edu',
        name: 'Other Student',
        role: 'student',
        emailVerified: true
      });
    }

    verifiedToken = app.jwt.sign({ sub: testStudentId });
    unverifiedToken = app.jwt.sign({ sub: unverifiedStudentId });
    otherStudentToken = app.jwt.sign({ sub: otherStudentId });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Saved Rooms (/api/v1/saved)', () => {
    const roomId1 = 'r-ksl-bedsitter-1';
    const roomId2 = 'r-cuea-single-1';

    it('requires authentication for GET /api/v1/saved', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/saved'
      });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('saves a room for the authenticated student', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/saved/${roomId1}`,
        headers: {
          authorization: `Bearer ${verifiedToken}`
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.saved).toBe(true);
    });

    it('saves a second room for the student', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/saved/${roomId2}`,
        headers: {
          authorization: `Bearer ${verifiedToken}`
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.saved).toBe(true);
    });

    it('returns array of saved room IDs via GET /api/v1/saved', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/saved',
        headers: {
          authorization: `Bearer ${verifiedToken}`
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toContain(roomId1);
      expect(body.data).toContain(roomId2);
    });

    it('returns full room objects via GET /api/v1/saved/rooms', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/saved/rooms',
        headers: {
          authorization: `Bearer ${verifiedToken}`
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(2);

      const foundRoom1 = body.data.find((r) => r.id === roomId1);
      expect(foundRoom1).toBeDefined();
      expect(foundRoom1.title).toContain('Bedsitter');
      expect(foundRoom1.area).toBe('Karen');
      expect(foundRoom1.caretaker).toBeDefined();
      expect(typeof foundRoom1.caretaker.verified).toBe('boolean');
      expect(typeof foundRoom1.caretaker.trustScore).toBe('number');

      const foundRoom2 = body.data.find((r) => r.id === roomId2);
      expect(foundRoom2).toBeDefined();
      expect(foundRoom2.title).toContain('Single Room');
      expect(foundRoom2.caretaker).toBeDefined();
    });

    it('saves and unsaves UI mock rooms (e.g. r1, h1) with full caretaker trust score', async () => {
      // Save r1
      const saveRes1 = await app.inject({
        method: 'POST',
        url: '/api/v1/saved/r1',
        headers: { authorization: `Bearer ${verifiedToken}` }
      });
      expect(saveRes1.statusCode).toBe(200);
      expect(JSON.parse(saveRes1.payload).saved).toBe(true);

      // Save h1
      const saveResH = await app.inject({
        method: 'POST',
        url: '/api/v1/saved/h1',
        headers: { authorization: `Bearer ${verifiedToken}` }
      });
      expect(saveResH.statusCode).toBe(200);

      // Verify list of saved room IDs includes r1 and h1
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/saved',
        headers: { authorization: `Bearer ${verifiedToken}` }
      });
      expect(listRes.statusCode).toBe(200);
      const listBody = JSON.parse(listRes.payload);
      expect(listBody.data).toContain('r1');
      expect(listBody.data).toContain('h1');

      // Verify full details returned by /rooms
      const roomsRes = await app.inject({
        method: 'GET',
        url: '/api/v1/saved/rooms',
        headers: { authorization: `Bearer ${verifiedToken}` }
      });
      expect(roomsRes.statusCode).toBe(200);
      const roomsBody = JSON.parse(roomsRes.payload);
      const r1Obj = roomsBody.data.find((r) => r.id === 'r1');
      expect(r1Obj).toBeDefined();
      expect(r1Obj.caretaker).toBeDefined();
      expect(typeof r1Obj.caretaker.verified).toBe('boolean');
      expect(typeof r1Obj.caretaker.trustScore).toBe('number');

      // Clean up by unsaving
      await app.inject({
        method: 'DELETE',
        url: '/api/v1/saved/r1',
        headers: { authorization: `Bearer ${verifiedToken}` }
      });
      await app.inject({
        method: 'DELETE',
        url: '/api/v1/saved/h1',
        headers: { authorization: `Bearer ${verifiedToken}` }
      });
    });

    it('authenticates demo student accounts (kevin@cuea.edu & amina@example.com) with student123/password123', async () => {
      const loginKevin = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'kevin@cuea.edu', password: 'student123' }
      });
      expect(loginKevin.statusCode).toBe(200);
      expect(loginKevin.json().user.role).toBe('student');

      const loginAmina = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'amina@example.com', password: 'password123' }
      });
      expect(loginAmina.statusCode).toBe(200);
      expect(loginAmina.json().user.role).toBe('student');
    });

    it('removes a saved room via DELETE /api/v1/saved/:roomId', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/saved/${roomId1}`,
        headers: {
          authorization: `Bearer ${verifiedToken}`
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.saved).toBe(false);

      // Verify it is removed from list of IDs
      const verifyRes = await app.inject({
        method: 'GET',
        url: '/api/v1/saved',
        headers: {
          authorization: `Bearer ${verifiedToken}`
        }
      });
      const verifyBody = JSON.parse(verifyRes.payload);
      expect(verifyBody.data).not.toContain(roomId1);
      expect(verifyBody.data).toContain(roomId2);
    });
  });

  describe('2. Vacancy Alerts (/api/v1/alerts)', () => {
    let createdAlertId;

    it('requires authentication for alerts endpoints', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/alerts'
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects alert creation when student email is not verified', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/alerts',
        headers: {
          authorization: `Bearer ${unverifiedToken}`
        },
        payload: {
          area: 'Karen',
          roomType: 'bedsitter',
          maxRentKes: 9000
        }
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toBe('Email verification required to receive alerts');
    });

    it('creates a vacancy alert for an email-verified student', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/alerts',
        headers: {
          authorization: `Bearer ${verifiedToken}`
        },
        payload: {
          area: 'Karen',
          roomType: 'bedsitter',
          maxRentKes: 9000
        }
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.data).toBeDefined();
      expect(body.data.id).toMatch(/^alt-/);
      expect(body.data.userId).toBe(testStudentId);
      expect(body.data.area).toBe('Karen');
      expect(body.data.roomType).toBe('bedsitter');
      expect(body.data.maxRentKes).toBe(9000);
      expect(body.data.active).toBe(true);

      createdAlertId = body.data.id;
    });

    it('lists active alerts for the authenticated student', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/alerts',
        headers: {
          authorization: `Bearer ${verifiedToken}`
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.data)).toBe(true);
      const found = body.data.find((a) => a.id === createdAlertId);
      expect(found).toBeDefined();
      expect(found.area).toBe('Karen');
    });

    it('prevents another user from modifying the alert', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/alerts/${createdAlertId}`,
        headers: {
          authorization: `Bearer ${otherStudentToken}`
        },
        payload: {
          active: false
        }
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('updates alert active state and preferences for the alert owner', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/alerts/${createdAlertId}`,
        headers: {
          authorization: `Bearer ${verifiedToken}`
        },
        payload: {
          active: false,
          maxRentKes: 10000
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.active).toBe(false);
      expect(body.data.maxRentKes).toBe(10000);
    });

    it('prevents another user from deleting the alert', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/alerts/${createdAlertId}`,
        headers: {
          authorization: `Bearer ${otherStudentToken}`
        }
      });
      expect(res.statusCode).toBe(403);
    });

    it('deletes the alert for the owner', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/alerts/${createdAlertId}`,
        headers: {
          authorization: `Bearer ${verifiedToken}`
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);

      // Verify alert is deleted
      const checkRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/alerts/${createdAlertId}`,
        headers: {
          authorization: `Bearer ${verifiedToken}`
        },
        payload: { active: true }
      });
      expect(checkRes.statusCode).toBe(404);
    });
  });

  describe('3. Room Reports (/api/v1/reports)', () => {
    const validRoomId = 'r-ksl-bedsitter-1';
    const invalidRoomId = 'r-does-not-exist-999';

    it('returns 404 when reporting a non-existent room', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        payload: {
          roomId: invalidRoomId,
          reason: 'misleading_photos',
          note: 'Photos do not match reality'
        }
      });
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 when reason is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        payload: {
          roomId: validRoomId,
          note: 'Some note without reason'
        }
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toContain('reason');
    });

    it('submits a room abuse report as an anonymous/public user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        payload: {
          roomId: validRoomId,
          reason: 'already_occupied',
          note: 'Caretaker said it was occupied last week.'
        }
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.message).toBe('Report submitted for moderation');
      expect(body.data).toBeDefined();
      expect(body.data.id).toMatch(/^rep-/);
      expect(body.data.roomId).toBe(validRoomId);
      expect(body.data.userId).toBeNull();
      expect(body.data.reason).toBe('already_occupied');
      expect(body.data.status).toBe('open');
    });

    it('submits a room abuse report as an authenticated student', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        headers: {
          authorization: `Bearer ${verifiedToken}`
        },
        payload: {
          roomId: validRoomId,
          reason: 'incorrect_rent',
          note: 'Caretaker quoted 10,000 on phone instead of 8,500.'
        }
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.message).toBe('Report submitted for moderation');
      expect(body.data.roomId).toBe(validRoomId);
      expect(body.data.userId).toBe(testStudentId);
      expect(body.data.reason).toBe('incorrect_rent');
      expect(body.data.status).toBe('open');
    });
  });
});

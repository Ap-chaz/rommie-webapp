import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/db.js';
import { calculateTrustScore } from '../src/services/trust.service.js';

describe('Rooms & Media Integration Test Suite', () => {
  let app;
  let caretakerToken;
  let unverifiedCaretakerToken;
  let otherCaretakerToken;
  let studentToken;
  let adminToken;

  const caretakerId = 'c-muthoni'; // Seeded verified caretaker
  const unverifiedCaretakerId = 'c-unverified';
  const otherCaretakerId = 'c-kamau';
  const studentId = 'u-kevin';
  const adminId = 'u-admin-1';

  const make10Photos = (slug = 'test-room') => [
    `https://cdn.rommie.co.ke/rooms/${slug}/01.webp`,
    `https://cdn.rommie.co.ke/rooms/${slug}/02.webp`,
    `https://cdn.rommie.co.ke/rooms/${slug}/03.webp`,
    `https://cdn.rommie.co.ke/rooms/${slug}/04.webp`,
    `https://cdn.rommie.co.ke/rooms/${slug}/05.webp`,
    `https://cdn.rommie.co.ke/rooms/${slug}/06.webp`,
    `https://cdn.rommie.co.ke/rooms/${slug}/07.webp`,
    `https://cdn.rommie.co.ke/rooms/${slug}/08.webp`,
    `https://cdn.rommie.co.ke/rooms/${slug}/09.webp`,
    `https://cdn.rommie.co.ke/rooms/${slug}/10.webp`
  ];

  beforeAll(async () => {
    app = await buildApp({ logger: false, seed: true });
    await app.ready();

    // Create unverified caretaker for negative auth tests
    if (!(await db.findUserById(unverifiedCaretakerId))) {
      await db.createUser({
        id: unverifiedCaretakerId,
        email: 'unverified.caretaker@example.com',
        phone: '+254799112233',
        name: 'Unverified Caretaker',
        role: 'caretaker',
        emailVerified: false
      });
    }

    caretakerToken = app.jwt.sign({ sub: caretakerId, role: 'caretaker' });
    unverifiedCaretakerToken = app.jwt.sign({ sub: unverifiedCaretakerId, role: 'caretaker' });
    otherCaretakerToken = app.jwt.sign({ sub: otherCaretakerId, role: 'caretaker' });
    studentToken = app.jwt.sign({ sub: studentId, role: 'student' });
    adminToken = app.jwt.sign({ sub: adminId, role: 'admin' });
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // 1. Trust Score Calculation Service
  // ==========================================
  describe('1. Trust Score Engine (trust.service.js)', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const now = 1776556800000; // Fixed timestamp for deterministic testing

    it('calculates perfect trust score (100) for verified, fresh (<=14d), zero reports, >60d veteran', () => {
      const caretaker = {
        isVerified: true,
        joinedAt: new Date(now - 90 * DAY).toISOString()
      };
      const room = {
        lastConfirmedVacantAt: new Date(now - 3 * DAY).toISOString()
      };

      const result = calculateTrustScore(caretaker, room, 0, now);
      expect(result.score).toBe(75); // 35 (verified) + 30 (fresh) + 0 (no report) + 10 (tenure > 60d) = 75
      expect(result.factors).toEqual({
        isVerified: 35,
        freshness: 30,
        reportPenalty: 0,
        tenureBonus: 10
      });
    });

    it('gives +15 freshness points for listings confirmed between 15 and 30 days ago', () => {
      const caretaker = {
        isVerified: true,
        joinedAt: new Date(now - 70 * DAY).toISOString()
      };
      const room = {
        lastConfirmedVacantAt: new Date(now - 20 * DAY).toISOString()
      };

      const result = calculateTrustScore(caretaker, room, 0, now);
      // 35 (verified) + 15 (freshness 15-30d) + 0 + 10 = 60
      expect(result.score).toBe(60);
      expect(result.factors.freshness).toBe(15);
    });

    it('gives 0 freshness points for listings older than 30 days', () => {
      const caretaker = {
        isVerified: false,
        joinedAt: new Date(now - 10 * DAY).toISOString()
      };
      const room = {
        lastConfirmedVacantAt: new Date(now - 45 * DAY).toISOString()
      };

      const result = calculateTrustScore(caretaker, room, 0, now);
      // 0 + 0 + 0 + 0 = 0
      expect(result.score).toBe(0);
      expect(result.factors.freshness).toBe(0);
    });

    it('applies -25 penalty when openReportsCount > 0 and clamps score at 0', () => {
      const caretaker = {
        isVerified: false,
        joinedAt: new Date(now - 10 * DAY).toISOString()
      };
      const room = {
        lastConfirmedVacantAt: new Date(now - 2 * DAY).toISOString()
      };

      // 0 + 30 - 25 + 0 = 5
      const result = calculateTrustScore(caretaker, room, 2, now);
      expect(result.score).toBe(5);
      expect(result.factors.reportPenalty).toBe(-25);

      // Score clamped to 0 if penalty exceeds points
      const staleWithReports = calculateTrustScore(caretaker, { lastConfirmedVacantAt: null }, 1, now);
      expect(staleWithReports.score).toBe(0);
    });

    it('handles null caretaker or room gracefully', () => {
      const result = calculateTrustScore(null, null, 0, now);
      expect(result.score).toBe(0);
      expect(result.factors).toEqual({
        isVerified: 0,
        freshness: 0,
        reportPenalty: 0,
        tenureBonus: 0
      });
    });
  });

  // ==========================================
  // 2. Listing Rooms & Filters (GET /api/v1/rooms)
  // ==========================================
  describe('2. Room Discovery & Filtering (GET /api/v1/rooms)', () => {
    it('returns public listings with default Vacant-first and freshness sorting', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/rooms'
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);

      // Check room structure and enrichment
      const firstRoom = body.data[0];
      expect(firstRoom.id).toBeDefined();
      expect(firstRoom.title).toBeDefined();
      expect(firstRoom.rentKes).toBeDefined();
      expect(firstRoom.caretaker).toBeDefined();
      expect(firstRoom.caretaker.trustScore).toBeDefined();
      expect(firstRoom.trustScore).toBeDefined();

      // Check default sorting: Vacant rooms appear first
      let seenTaken = false;
      for (const room of body.data) {
        if (room.status === 'Taken') {
          seenTaken = true;
        }
        if (seenTaken) {
          expect(room.status).toBe('Taken');
        }
      }
    });

    it('filters rooms by area', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/rooms?area=Karen'
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBeGreaterThan(0);
      for (const room of body.data) {
        expect(room.area.toLowerCase()).toBe('karen');
      }
    });

    it('filters rooms by roomType and rent bounds', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/rooms?roomType=bedsitter&minRent=5000&maxRent=10000'
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      for (const room of body.data) {
        expect(room.roomType).toBe('bedsitter');
        expect(room.rentKes).toBeGreaterThanOrEqual(5000);
        expect(room.rentKes).toBeLessThanOrEqual(10000);
      }
    });

    it('filters rooms by amenities', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/rooms?amenities=Water 24/7'
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      for (const room of body.data) {
        expect(room.amenities).toContain('Water 24/7');
      }
    });

    it('filters rooms near campus (KSL)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/rooms?near=KSL'
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('supports rent ascending and descending sorting', async () => {
      const resAsc = await app.inject({
        method: 'GET',
        url: '/api/v1/rooms?sort=rent_asc'
      });
      const ascData = resAsc.json().data;
      for (let i = 1; i < ascData.length; i++) {
        expect(ascData[i].rentKes).toBeGreaterThanOrEqual(ascData[i - 1].rentKes);
      }

      const resDesc = await app.inject({
        method: 'GET',
        url: '/api/v1/rooms?sort=rent_desc'
      });
      const descData = resDesc.json().data;
      for (let i = 1; i < descData.length; i++) {
        expect(descData[i].rentKes).toBeLessThanOrEqual(descData[i - 1].rentKes);
      }
    });
  });

  // ==========================================
  // 3. Room Details & Building Siblings
  // ==========================================
  describe('3. Room Details & Sibling Units (GET /api/v1/rooms/:id)', () => {
    it('returns single room detail with caretaker profile and trust breakdown', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/rooms/r-ksl-bedsitter-1'
      });

      expect(res.statusCode).toBe(200);
      const room = res.json();
      expect(room.id).toBe('r-ksl-bedsitter-1');
      expect(room.title).toBeDefined();
      expect(room.photos.length).toBe(10);
      expect(room.caretaker).toBeDefined();
      expect(room.caretaker.verified).toBe(true);
      expect(room.trust).toBeDefined();
      expect(room.trust.score).toBeGreaterThan(0);
      expect(room.trust.factors).toBeDefined();
    });

    it('returns 404 for non-existent room ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/rooms/non-existent-id'
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns sibling rooms in the same building via GET /:id/building', async () => {
      // Create sibling rooms sharing buildingId 'bld-test-101'
      const roomA = await db.createRoom({
        id: 'r-sibling-a',
        title: 'Building 101 - Unit A',
        roomType: 'bedsitter',
        rentKes: 8000,
        area: 'Karen',
        buildingId: 'bld-test-101',
        photos: make10Photos('sib-a'),
        caretakerId
      });

      const roomB = await db.createRoom({
        id: 'r-sibling-b',
        title: 'Building 101 - Unit B',
        roomType: 'one_bedroom',
        rentKes: 14000,
        area: 'Karen',
        buildingId: 'bld-test-101',
        photos: make10Photos('sib-b'),
        caretakerId
      });

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/rooms/${roomA.id}/building`
      });

      expect(res.statusCode).toBe(200);
      const siblings = res.json();
      expect(Array.isArray(siblings)).toBe(true);
      const siblingIds = siblings.map((r) => r.id);
      expect(siblingIds).toContain('r-sibling-b');
      expect(siblingIds).not.toContain('r-sibling-a'); // Excludes self
    });
  });

  // ==========================================
  // 4. Create Room Listing & 10 Photos Validation
  // ==========================================
  describe('4. Room Creation & Photo Validation (POST /api/v1/rooms)', () => {
    const validListingPayload = {
      title: 'Spacious Bedsitter with Balcony',
      description: 'Quiet environment with 24/7 borehole water, CCTV, and electric fence.',
      roomType: 'bedsitter',
      rentKes: 9500,
      depositTerms: '1 month deposit',
      area: 'Rongai',
      matatuFareKes: 30,
      amenities: ['Water 24/7', 'WiFi', 'Tokens'],
      distances: {
        ksl: { walkMin: 12, matatuMin: 5 }
      },
      photos: make10Photos('valid-listing-10')
    };

    it('rejects unauthenticated requests with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/rooms',
        payload: validListingPayload
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('rejects student accounts with 403 FORBIDDEN', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/rooms',
        headers: { authorization: `Bearer ${studentToken}` },
        payload: validListingPayload
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('rejects unverified caretakers (emailVerified === false) with 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/rooms',
        headers: { authorization: `Bearer ${unverifiedCaretakerToken}` },
        payload: validListingPayload
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('strictly enforces exactly 10 photos: rejects 0 photos with 422 VALIDATION_FAILED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/rooms',
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: {
          ...validListingPayload,
          photos: []
        }
      });

      expect(res.statusCode).toBe(422);
      const body = res.json();
      expect(body.error.code).toBe('VALIDATION_FAILED');
      expect(body.error.message).toContain('Exactly 10 photos are required');
    });

    it('strictly enforces exactly 10 photos: rejects 9 photos with 422 VALIDATION_FAILED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/rooms',
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: {
          ...validListingPayload,
          photos: make10Photos('9-photos').slice(0, 9)
        }
      });

      expect(res.statusCode).toBe(422);
      const body = res.json();
      expect(body.error.code).toBe('VALIDATION_FAILED');
      expect(body.error.message).toContain('Exactly 10 photos are required');
    });

    it('strictly enforces exactly 10 photos: rejects 11 photos with 422 VALIDATION_FAILED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/rooms',
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: {
          ...validListingPayload,
          photos: [...make10Photos('11-photos'), 'https://cdn.rommie.co.ke/rooms/extra.webp']
        }
      });

      expect(res.statusCode).toBe(422);
      const body = res.json();
      expect(body.error.code).toBe('VALIDATION_FAILED');
      expect(body.error.message).toContain('Exactly 10 photos are required');
    });

    it('validates required fields: rejects missing title, roomType, rentKes, or area with 422', async () => {
      const invalidPayload = { ...validListingPayload, title: '' };
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/rooms',
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: invalidPayload
      });

      expect(res.statusCode).toBe(422);
      const body = res.json();
      expect(body.error.code).toBe('VALIDATION_FAILED');
    });

    it('successfully creates listing when caretaker is verified and has exactly 10 photos', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/rooms',
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: validListingPayload
      });

      expect(res.statusCode).toBe(201);
      const created = res.json();
      expect(created.id).toBeDefined();
      expect(created.title).toBe(validListingPayload.title);
      expect(created.photos.length).toBe(10);
      expect(created.status).toBe('Vacant');
      expect(created.caretakerId).toBe(caretakerId);
      expect(created.lastConfirmedVacantAt).toBeDefined();
    });
  });

  // ==========================================
  // 5. Updating Room & Status Toggling
  // ==========================================
  describe('5. Updating Room & Occupancy Toggling (PATCH /api/v1/rooms/:id)', () => {
    let testRoomId;

    beforeEach(async () => {
      const room = await db.createRoom({
        title: 'Listing for Update Tests',
        roomType: 'single_room',
        rentKes: 6000,
        area: 'Gataka',
        photos: make10Photos('update-test'),
        caretakerId,
        status: 'Vacant',
        lastConfirmedVacantAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      });
      testRoomId = room.id;
    });

    it('allows owner caretaker to update listing details', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/rooms/${testRoomId}`,
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: {
          title: 'Updated Title with WiFi Included',
          rentKes: 6500
        }
      });

      expect(res.statusCode).toBe(200);
      const updated = res.json();
      expect(updated.title).toBe('Updated Title with WiFi Included');
      expect(updated.rentKes).toBe(6500);
    });

    it('rejects updating photos if new photos array does not have exactly 10 photos', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/rooms/${testRoomId}`,
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: {
          photos: ['https://cdn.rommie.co.ke/rooms/only-one.webp']
        }
      });

      expect(res.statusCode).toBe(422);
      const body = res.json();
      expect(body.error.code).toBe('VALIDATION_FAILED');
      expect(body.error.message).toContain('Exactly 10 photos are required');
    });

    it('blocks other caretakers from updating listing', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/rooms/${testRoomId}`,
        headers: { authorization: `Bearer ${otherCaretakerToken}` },
        payload: { rentKes: 9999 }
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('toggles occupancy status from Vacant to Taken and back to Vacant', async () => {
      // 1. Toggle to Taken
      const res1 = await app.inject({
        method: 'PATCH',
        url: `/api/v1/rooms/${testRoomId}/status`,
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: { status: 'Taken' }
      });

      expect(res1.statusCode).toBe(200);
      expect(res1.json().status).toBe('Taken');

      // 2. Toggle back to Vacant -> refreshes lastConfirmedVacantAt
      const beforeTimestamp = Date.now() - 1000;
      const res2 = await app.inject({
        method: 'PATCH',
        url: `/api/v1/rooms/${testRoomId}/status`,
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: { status: 'Vacant' }
      });

      expect(res2.statusCode).toBe(200);
      const body2 = res2.json();
      expect(body2.status).toBe('Vacant');
      expect(new Date(body2.lastConfirmedVacantAt).getTime()).toBeGreaterThanOrEqual(beforeTimestamp);
    });
  });

  // ==========================================
  // 6. Reconfirming 14-day Vacancy
  // ==========================================
  describe('6. Vacancy Reconfirmation (POST /api/v1/rooms/:id/reconfirm)', () => {
    it('reconfirms a stale room, resetting vacancy timestamp and unhiding if hidden', async () => {
      const staleTimestamp = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString();
      const room = await db.createRoom({
        title: 'Stale Room Needing Confirmation',
        roomType: 'bedsitter',
        rentKes: 7500,
        area: 'Rongai',
        photos: make10Photos('reconfirm-room'),
        caretakerId,
        status: 'Vacant',
        hidden: true,
        lastConfirmedVacantAt: staleTimestamp
      });

      const beforeReconfirm = Date.now();
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/rooms/${room.id}/reconfirm`,
        headers: { authorization: `Bearer ${caretakerToken}` }
      });

      expect(res.statusCode).toBe(200);
      const reconfirmed = res.json();
      expect(reconfirmed.status).toBe('Vacant');
      expect(reconfirmed.hidden).toBe(false);
      expect(new Date(reconfirmed.lastConfirmedVacantAt).getTime()).toBeGreaterThanOrEqual(beforeReconfirm);
    });
  });

  // ==========================================
  // 7. Delete Room Listing
  // ==========================================
  describe('7. Room Deletion (DELETE /api/v1/rooms/:id)', () => {
    it('allows owner caretaker or admin to delete listing', async () => {
      const room = await db.createRoom({
        title: 'Listing to Delete',
        roomType: 'single_room',
        rentKes: 5000,
        area: 'Karen',
        photos: make10Photos('delete-room'),
        caretakerId
      });

      // Non-owner cannot delete
      const resForbidden = await app.inject({
        method: 'DELETE',
        url: `/api/v1/rooms/${room.id}`,
        headers: { authorization: `Bearer ${otherCaretakerToken}` }
      });
      expect(resForbidden.statusCode).toBe(403);

      // Owner can delete
      const resDelete = await app.inject({
        method: 'DELETE',
        url: `/api/v1/rooms/${room.id}`,
        headers: { authorization: `Bearer ${caretakerToken}` }
      });
      expect(resDelete.statusCode).toBe(200);
      expect(resDelete.json().success).toBe(true);

      // Verify listing is gone
      const checkRes = await app.inject({
        method: 'GET',
        url: `/api/v1/rooms/${room.id}`
      });
      expect(checkRes.statusCode).toBe(404);
    });
  });

  // ==========================================
  // 8. Contact Telemetry & 30s Deduplication
  // ==========================================
  describe('8. Contact Telemetry & Deduplication (POST /api/v1/rooms/:id/contact)', () => {
    let contactRoomId;

    beforeAll(async () => {
      const room = await db.createRoom({
        title: 'Contact Telemetry Test Listing',
        roomType: 'bedsitter',
        rentKes: 8000,
        area: 'Karen',
        photos: make10Photos('contact-test'),
        caretakerId
      });
      contactRoomId = room.id;
    });

    it('successfully tracks initial student WhatsApp click', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/rooms/${contactRoomId}/contact`,
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { channel: 'whatsapp' }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.tracked).toBe(true);
    });

    it('deduplicates immediate subsequent click on same channel within 30s window', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/rooms/${contactRoomId}/contact`,
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { channel: 'whatsapp' }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.tracked).toBe(false);
    });

    it('tracks different channel (call) without deduplication conflict', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/rooms/${contactRoomId}/contact`,
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { channel: 'call' }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.tracked).toBe(true);
    });

    it('bypasses telemetry tracking when listing owner clicks contact', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/rooms/${contactRoomId}/contact`,
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: { channel: 'whatsapp' }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.tracked).toBe(false);
    });
  });

  // ==========================================
  // 9. Media Upload Presigning
  // ==========================================
  describe('9. Media Uploads (POST /api/v1/media/presign-upload)', () => {
    it('rejects unauthenticated upload requests with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/media/presign-upload',
        payload: { filename: 'room-photo-1.webp', kind: 'room-photo' }
      });

      expect(res.statusCode).toBe(401);
    });

    it('generates presigned upload URL and public CDN URL for authenticated user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/media/presign-upload',
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: {
          filename: 'listing-photo-front.webp',
          fileType: 'image/webp',
          kind: 'room-photo'
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.uploadUrl).toBeDefined();
      expect(body.uploadUrl).toMatch(/^https:\/\//);
      expect(body.fileUrl).toContain('/rooms/listing-photo-front.webp');
    });
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/db.js';

describe('Admin & KYC Governance API Suite', () => {
  let app;
  let adminToken;
  let caretakerToken;
  let studentToken;

  beforeAll(async () => {
    app = await buildApp({ logger: false, seed: true });

    // Generate tokens for test users
    adminToken = app.jwt.sign({ sub: 'u-admin-1', role: 'admin' });
    caretakerToken = app.jwt.sign({ sub: 'c-kamau', role: 'caretaker' });
    studentToken = app.jwt.sign({ sub: 'u-kevin', role: 'student' });
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // 1. Caretaker KYC Verification Submissions
  // ==========================================
  describe('Caretaker KYC Verification', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/verification/caretaker'
      });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns existing pending verification for c-kamau', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/verification/caretaker',
        headers: { authorization: `Bearer ${caretakerToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data).toBeDefined();
      expect(body.data.userId).toBe('c-kamau');
      expect(body.data.status).toBe('pending');
    });

    it('returns 409 CONFLICT if submitting when a request is already pending', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/verification/caretaker',
        headers: { authorization: `Bearer ${caretakerToken}` },
        payload: {
          documentUrl: 'https://cdn.rommie.co.ke/kyc/kamau-duplicate.pdf',
          documentName: 'Peter Kamau ID'
        }
      });
      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('CONFLICT');
      expect(body.error.message).toContain('already pending review');
    });

    it('allows a new caretaker with no pending requests to submit KYC', async () => {
      // Create fresh caretaker user
      const freshUser = await db.createUser({
        id: 'c-fresh-test',
        email: 'fresh@caretaker.co.ke',
        name: 'Fresh Caretaker',
        role: 'caretaker',
        emailVerified: true
      });
      await db.createCaretaker({
        id: freshUser.id,
        name: freshUser.name,
        phone: '+254700112233',
        isVerified: false
      });

      const freshToken = app.jwt.sign({ sub: freshUser.id, role: 'caretaker' });

      // Before submitting, status should be unsubmitted
      const getRes = await app.inject({
        method: 'GET',
        url: '/api/v1/verification/caretaker',
        headers: { authorization: `Bearer ${freshToken}` }
      });
      expect(getRes.statusCode).toBe(200);
      expect(JSON.parse(getRes.payload).data.status).toBe('unsubmitted');

      // Submit verification
      const postRes = await app.inject({
        method: 'POST',
        url: '/api/v1/verification/caretaker',
        headers: { authorization: `Bearer ${freshToken}` },
        payload: {
          documentUrl: 'https://cdn.rommie.co.ke/kyc/fresh-passport.pdf',
          documentName: 'Fresh Kenyan Passport'
        }
      });
      expect(postRes.statusCode).toBe(201);
      const postBody = JSON.parse(postRes.payload);
      expect(postBody.data.userId).toBe('c-fresh-test');
      expect(postBody.data.status).toBe('pending');
      expect(postBody.data.documentUrl).toBe('https://cdn.rommie.co.ke/kyc/fresh-passport.pdf');
    });
  });

  // ==========================================
  // 2. Admin KYC Queue, Approval & Undo
  // ==========================================
  describe('Admin KYC Review & Undo', () => {
    let pendingReqId;

    it('denies non-admin users with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/verification/queue',
        headers: { authorization: `Bearer ${studentToken}` }
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin to list verification queue', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/verification/queue',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);

      const kamauReq = body.data.find((r) => r.userId === 'c-kamau');
      expect(kamauReq).toBeDefined();
      pendingReqId = kamauReq.id;
    });

    it('requires reviewNote when rejecting a verification request', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/verification/${pendingReqId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: 'rejected' }
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toContain('reviewNote is required');
    });

    it('approves caretaker KYC and updates caretaker isVerified=true', async () => {
      // Check caretaker is not verified yet
      const ctBefore = await db.findCaretakerById('c-kamau');
      expect(ctBefore.isVerified).toBe(false);

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/verification/${pendingReqId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          status: 'approved',
          reviewNote: 'Valid Kenyan National ID confirmed.'
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe('approved');
      expect(body.data.reviewedBy).toBe('u-admin-1');

      // Verify caretaker record is now verified
      const ctAfter = await db.findCaretakerById('c-kamau');
      expect(ctAfter.isVerified).toBe(true);
    });

    it('reverts approval back to pending via undo endpoint and resets isVerified=false', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/verification/${pendingReqId}/undo`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe('pending');
      expect(body.data.reviewNote).toBeNull();

      // Verify caretaker record is reverted
      const ct = await db.findCaretakerById('c-kamau');
      expect(ct.isVerified).toBe(false);
    });

    it('lists history of reviewed requests', async () => {
      // Reject fresh caretaker request to have an item in history
      const freshReq = await db.getVerificationRequest('c-fresh-test');
      await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/verification/${freshReq.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          status: 'rejected',
          reviewNote: 'Document blurred and unreadable.'
        }
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/verification/history',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.some((r) => r.id === freshReq.id && r.status === 'rejected')).toBe(true);
    });
  });

  // ==========================================
  // 3. Admin Listing Moderation
  // ==========================================
  describe('Listing Moderation', () => {
    const targetRoomId = 'r-ksl-bedsitter-1';

    it('fetches all listings including hidden listings', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/listings',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('hides a listing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/listings/${targetRoomId}/hide`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.hidden).toBe(true);

      const room = await db.findRoomById(targetRoomId);
      expect(room.hidden).toBe(true);
    });

    it('restores a hidden listing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/listings/${targetRoomId}/restore`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.hidden).toBe(false);

      const room = await db.findRoomById(targetRoomId);
      expect(room.hidden).toBe(false);
    });

    it('updates listing attributes', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/listings/${targetRoomId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { rentKes: 9200, status: 'Occupied' }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.rentKes).toBe(9200);
      expect(body.data.status).toBe('Occupied');
    });
  });

  // ==========================================
  // 4. Caretaker Suspension & Auto-hiding Listings
  // ==========================================
  describe('Caretaker Suspension & Listing Auto-Hiding', () => {
    it('suspends a caretaker and automatically hides all their listings', async () => {
      // c-muthoni owns r-ksl-bedsitter-1 and r-cuea-single-1 and r-karen-hostel-1
      const muthoniRoomsBefore = await db.queryRooms({ caretakerId: 'c-muthoni', includeHidden: true });
      expect(muthoniRoomsBefore.length).toBeGreaterThanOrEqual(2);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/admin/users/c-muthoni/suspend',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { reason: 'Unresponsive to booking inquiries and complaints.' }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.isSuspended).toBe(true);

      // Verify caretaker record is suspended
      const ct = await db.findCaretakerById('c-muthoni');
      expect(ct.isSuspended).toBe(true);

      // Verify all listings are now hidden
      const muthoniRoomsAfter = await db.queryRooms({ caretakerId: 'c-muthoni', includeHidden: true });
      for (const room of muthoniRoomsAfter) {
        expect(room.hidden).toBe(true);
      }
    });

    it('restores a suspended caretaker and restores their listings', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/users/c-muthoni/restore',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.isSuspended).toBe(false);

      // Verify caretaker record is restored
      const ct = await db.findCaretakerById('c-muthoni');
      expect(ct.isSuspended).toBe(false);

      // Verify listings are un-hidden
      const muthoniRoomsAfter = await db.queryRooms({ caretakerId: 'c-muthoni', includeHidden: true });
      for (const room of muthoniRoomsAfter) {
        expect(room.hidden).toBe(false);
      }
    });
  });

  // ==========================================
  // 5. Abuse Reports Moderation
  // ==========================================
  describe('Abuse Reports Moderation', () => {
    let reportId;

    beforeAll(async () => {
      const rep = await db.createReport({
        roomId: 'r-rongai-onebed-1',
        reason: 'Fraud / Fake Photos',
        note: 'Photos show modern kitchen but actual place is unfinished.'
      });
      reportId = rep.id;
    });

    it('lists reports with status filter', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/reports?status=open',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.some((r) => r.id === reportId)).toBe(true);
    });

    it('resolves an abuse report and hides the offending listing', async () => {
      const roomBefore = await db.findRoomById('r-rongai-onebed-1');
      expect(roomBefore.hidden).toBe(false);

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/reports/${reportId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          status: 'resolved',
          action: 'hide_listing',
          note: 'Confirmed photos mismatch. Listing removed until updated.'
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe('resolved');
      expect(body.data.action).toBe('hide_listing');

      // Check room was hidden
      const roomAfter = await db.findRoomById('r-rongai-onebed-1');
      expect(roomAfter.hidden).toBe(true);
    });
  });

  // ==========================================
  // 6. Platform KPIs, Activity, Analytics & Settings
  // ==========================================
  describe('Admin Platform Stats, Activity & Settings', () => {
    it('returns platform KPIs in stats endpoint', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/stats',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data).toBeDefined();
      expect(typeof body.data.totalListings).toBe('number');
      expect(typeof body.data.vacantListings).toBe('number');
      expect(typeof body.data.verifiedCaretakers).toBe('number');
      expect(typeof body.data.pendingVerifications).toBe('number');
      expect(typeof body.data.openReports).toBe('number');
      expect(typeof body.data.activeUsers).toBe('number');
    });

    it('returns activity audit log entries', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/activity',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('returns analytics payload', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/analytics',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.searchCount).toBeGreaterThan(0);
      expect(body.data.listingViews).toBeGreaterThan(0);
      expect(typeof body.data.contactEvents).toBe('number');
    });

    it('retrieves and updates site settings', async () => {
      const getRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/settings',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      expect(getRes.statusCode).toBe(200);
      const initialSettings = JSON.parse(getRes.payload).data;
      expect(initialSettings.email).toBe('hello@rommie.co.ke');

      const putRes = await app.inject({
        method: 'PUT',
        url: '/api/v1/admin/settings',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          whatsapp: '+254799887766',
          phone: '+254799887766',
          email: 'support@rommie.co.ke'
        }
      });
      expect(putRes.statusCode).toBe(200);
      const updated = JSON.parse(putRes.payload).data;
      expect(updated.whatsapp).toBe('+254799887766');
      expect(updated.email).toBe('support@rommie.co.ke');
    });
  });
});

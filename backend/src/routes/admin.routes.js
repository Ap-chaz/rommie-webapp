import { db } from '../db/db.js';

export default async function (fastify, opts) {
  // All admin endpoints require authentication AND admin role
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (reply.sent) return;
    await fastify.requireRole('admin')(request, reply);
  });

  // ==========================================
  // Caretaker KYC Verification Queue
  // ==========================================

  // GET /api/v1/admin/verification/queue
  fastify.get('/verification/queue', async (request, reply) => {
    const queue = await db.listVerificationQueue();
    return reply.status(200).send({ data: queue });
  });

  // GET /api/v1/admin/verification/history
  fastify.get('/verification/history', async (request, reply) => {
    const history = await db.listVerificationHistory();
    return reply.status(200).send({ data: history });
  });

  // PATCH /api/v1/admin/verification/:id
  fastify.patch('/verification/:id', async (request, reply) => {
    const { id } = request.params;
    const { status, reviewNote } = request.body || {};

    if (!['approved', 'rejected'].includes(status)) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Status must be either "approved" or "rejected".',
          field: 'status',
          details: []
        }
      });
    }

    if (status === 'rejected' && (!reviewNote || !String(reviewNote).trim())) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'reviewNote is required when rejecting a verification request.',
          field: 'reviewNote',
          details: []
        }
      });
    }

    const verReq = await db.findVerificationRequestById(id);
    if (!verReq) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Verification request not found.',
          field: null,
          details: []
        }
      });
    }

    if (status === 'approved') {
      await db.updateCaretaker(verReq.userId, { isVerified: true });
    }

    const updatedReq = await db.updateVerificationRequest(id, {
      status,
      reviewNote: reviewNote ? String(reviewNote).trim() : null,
      reviewedAt: new Date().toISOString(),
      reviewedBy: request.user.id
    });

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: `kyc_${status}`,
      category: 'kyc',
      targetType: 'verification_request',
      targetId: id,
      details: { status, reviewNote: reviewNote || null, userId: verReq.userId }
    });

    return reply.status(200).send({ data: updatedReq });
  });

  // POST /api/v1/admin/verification/:id/undo
  fastify.post('/verification/:id/undo', async (request, reply) => {
    const { id } = request.params;
    const verReq = await db.findVerificationRequestById(id);

    if (!verReq) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Verification request not found.',
          field: null,
          details: []
        }
      });
    }

    if (verReq.status === 'approved') {
      await db.updateCaretaker(verReq.userId, { isVerified: false });
    }

    const updatedReq = await db.updateVerificationRequest(id, {
      status: 'pending',
      reviewNote: null,
      reviewedAt: null,
      reviewedBy: null
    });

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: 'kyc_undo',
      category: 'kyc',
      targetType: 'verification_request',
      targetId: id,
      details: { previousStatus: verReq.status, userId: verReq.userId }
    });

    return reply.status(200).send({ data: updatedReq });
  });

  // ==========================================
  // Listing Moderation
  // ==========================================

  // GET /api/v1/admin/listings
  fastify.get('/listings', async (request, reply) => {
    const listings = await db.queryRooms({ includeHidden: true });
    return reply.status(200).send({ data: listings });
  });

  // PATCH /api/v1/admin/listings/:id
  fastify.patch('/listings/:id', async (request, reply) => {
    const { id } = request.params;
    const room = await db.findRoomById(id);

    if (!room) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found.',
          field: null,
          details: []
        }
      });
    }

    const updatedRoom = await db.updateRoom(id, request.body || {});

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: 'listing_update',
      category: 'moderation',
      targetType: 'room',
      targetId: id,
      details: request.body || {}
    });

    return reply.status(200).send({ data: updatedRoom });
  });

  // POST /api/v1/admin/listings/:id/hide
  fastify.post('/listings/:id/hide', async (request, reply) => {
    const { id } = request.params;
    const room = await db.findRoomById(id);

    if (!room) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found.',
          field: null,
          details: []
        }
      });
    }

    const updatedRoom = await db.updateRoom(id, { hidden: true });

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: 'listing_hide',
      category: 'moderation',
      targetType: 'room',
      targetId: id,
      details: { title: updatedRoom.title }
    });

    return reply.status(200).send({ data: updatedRoom });
  });

  // POST /api/v1/admin/listings/:id/restore
  fastify.post('/listings/:id/restore', async (request, reply) => {
    const { id } = request.params;
    const room = await db.findRoomById(id);

    if (!room) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found.',
          field: null,
          details: []
        }
      });
    }

    const updatedRoom = await db.updateRoom(id, { hidden: false });

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: 'listing_restore',
      category: 'moderation',
      targetType: 'room',
      targetId: id,
      details: { title: updatedRoom.title }
    });

    return reply.status(200).send({ data: updatedRoom });
  });

  // DELETE /api/v1/admin/listings/:id
  fastify.delete('/listings/:id', async (request, reply) => {
    const { id } = request.params;
    const room = await db.findRoomById(id);

    if (!room) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found.',
          field: null,
          details: []
        }
      });
    }

    await db.deleteRoom(id);

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: 'listing_delete',
      category: 'moderation',
      targetType: 'room',
      targetId: id,
      details: { title: room.title }
    });

    return reply.status(200).send({
      data: { success: true, id }
    });
  });

  // ==========================================
  // User Management
  // ==========================================

  // GET /api/v1/admin/users
  fastify.get('/users', async (request, reply) => {
    const role = request.query?.role;
    const users = await db.listUsers(role);
    return reply.status(200).send({ data: users });
  });

  // PATCH /api/v1/admin/users/:id/suspend
  fastify.patch('/users/:id/suspend', async (request, reply) => {
    const { id } = request.params;
    const { reason } = request.body || {};

    const user = await db.findUserById(id);
    if (!user) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.',
          field: null,
          details: []
        }
      });
    }

    const updatedUser = await db.updateUser(id, {
      isSuspended: true,
      suspensionReason: reason || null
    });

    await db.updateCaretaker(id, { isSuspended: true });

    // Automatically hide all listings belonging to caretaker
    const caretakerRooms = await db.queryRooms({ caretakerId: id, includeHidden: true });
    for (const room of caretakerRooms) {
      await db.updateRoom(room.id, { hidden: true });
    }

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: 'user_suspend',
      category: 'user_management',
      targetType: 'user',
      targetId: id,
      details: { reason, email: user.email, hiddenListingsCount: caretakerRooms.length }
    });

    return reply.status(200).send({ data: updatedUser });
  });

  // POST /api/v1/admin/users/:id/restore
  fastify.post('/users/:id/restore', async (request, reply) => {
    const { id } = request.params;

    const user = await db.findUserById(id);
    if (!user) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.',
          field: null,
          details: []
        }
      });
    }

    const updatedUser = await db.updateUser(id, {
      isSuspended: false,
      suspensionReason: null
    });

    await db.updateCaretaker(id, { isSuspended: false });

    // Automatically restore/unhide all listings belonging to caretaker
    const caretakerRooms = await db.queryRooms({ caretakerId: id, includeHidden: true });
    for (const room of caretakerRooms) {
      await db.updateRoom(room.id, { hidden: false });
    }

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: 'user_restore',
      category: 'user_management',
      targetType: 'user',
      targetId: id,
      details: { email: user.email, restoredListingsCount: caretakerRooms.length }
    });

    return reply.status(200).send({ data: updatedUser });
  });

  // ==========================================
  // Abuse Reports
  // ==========================================

  // GET /api/v1/admin/reports
  fastify.get('/reports', async (request, reply) => {
    const status = request.query?.status;
    const reports = await db.listReports(status);
    return reply.status(200).send({ data: reports });
  });

  // PATCH /api/v1/admin/reports/:id
  fastify.patch('/reports/:id', async (request, reply) => {
    const { id } = request.params;
    const { status, action, note } = request.body || {};

    if (!['resolved', 'dismissed'].includes(status)) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Status must be either "resolved" or "dismissed".',
          field: 'status',
          details: []
        }
      });
    }

    const rep = await db.findReportById(id);
    if (!rep) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found.',
          field: null,
          details: []
        }
      });
    }

    const updatedReport = await db.updateReport(id, {
      status,
      action: action || null,
      note: note !== undefined ? note : rep.note,
      handledAt: new Date().toISOString(),
      handledBy: request.user.id
    });

    if (action === 'hide_listing' && rep.roomId) {
      await db.updateRoom(rep.roomId, { hidden: true });
    }

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: `report_${status}`,
      category: 'moderation',
      targetType: 'report',
      targetId: id,
      details: { status, action, roomId: rep.roomId }
    });

    return reply.status(200).send({ data: updatedReport });
  });

  // ==========================================
  // Platform KPIs & Analytics & Activity & Settings
  // ==========================================

  // GET /api/v1/admin/stats
  fastify.get('/stats', async (request, reply) => {
    let totalListings = 0;
    let vacantListings = 0;
    let verifiedCaretakers = 0;
    let pendingVerifications = 0;
    let openReports = 0;
    let activeUsers = 0;

    if (db.usePostgres) {
      try {
        const [roomsRes, caretakersRes, verRes, reportsRes, usersRes] = await Promise.all([
          db.pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'Vacant\') as vacant FROM rooms;'),
          db.pool.query('SELECT COUNT(*) as verified FROM caretakers WHERE is_verified = true;'),
          db.pool.query('SELECT COUNT(*) as pending FROM verification_requests WHERE status = \'pending\';'),
          db.pool.query('SELECT COUNT(*) as open FROM listing_reports WHERE status = \'open\';'),
          db.pool.query('SELECT COUNT(*) as active FROM users;')
        ]);
        totalListings = parseInt(roomsRes.rows[0].total, 10);
        vacantListings = parseInt(roomsRes.rows[0].vacant, 10);
        verifiedCaretakers = parseInt(caretakersRes.rows[0].verified, 10);
        pendingVerifications = parseInt(verRes.rows[0].pending, 10);
        openReports = parseInt(reportsRes.rows[0].open, 10);
        activeUsers = parseInt(usersRes.rows[0].active, 10);
      } catch (err) {
        console.error('[Admin:stats] Postgres error:', err.message);
      }
    } else {
      const allRooms = Array.from(db.state.rooms.values());
      totalListings = allRooms.length;
      vacantListings = allRooms.filter((r) => r.status === 'Vacant').length;
      const allCaretakers = Array.from(db.state.caretakers.values());
      verifiedCaretakers = allCaretakers.filter((c) => Boolean(c.isVerified)).length;
      const allVerifications = Array.from(db.state.verificationRequests.values());
      pendingVerifications = allVerifications.filter((v) => v.status === 'pending').length;
      const allReports = Array.from(db.state.reports.values());
      openReports = allReports.filter((r) => r.status === 'open').length;
      const allUsers = Array.from(db.state.users.values());
      activeUsers = allUsers.filter((u) => !u.isSuspended).length;
    }

    return reply.status(200).send({
      data: {
        totalListings,
        vacantListings,
        verifiedCaretakers,
        pendingVerifications,
        openReports,
        activeUsers
      }
    });
  });

  // GET /api/v1/admin/activity
  fastify.get('/activity', async (request, reply) => {
    const category = request.query?.category;
    const activity = await db.listActivityEntries(category);
    return reply.status(200).send({ data: activity });
  });

  // GET /api/v1/admin/analytics
  fastify.get('/analytics', async (request, reply) => {
    let contactCount = 0;
    if (db.usePostgres) {
      try {
        const res = await db.pool.query('SELECT COUNT(*) as count FROM contact_events;');
        contactCount = parseInt(res.rows[0].count, 10);
      } catch (err) {
        console.error('[Admin:analytics] Postgres error:', err.message);
      }
    } else {
      contactCount = db.state.contactEvents?.length || 0;
    }
    return reply.status(200).send({
      data: {
        searchCount: 1420,
        listingViews: 8650,
        contactEvents: contactCount,
        inquiriesByChannel: {
          whatsapp: 84,
          call: 36
        }
      }
    });
  });

  // GET /api/v1/admin/settings
  fastify.get('/settings', async (request, reply) => {
    const settings = await db.getSiteSettings();
    return reply.status(200).send({ data: settings });
  });

  // PUT /api/v1/admin/settings
  fastify.put('/settings', async (request, reply) => {
    const updatedSettings = await db.updateSiteSettings(request.body || {});

    await db.createActivityEntry({
      actorId: request.user.id,
      actorName: request.user.name,
      action: 'settings_update',
      category: 'admin',
      targetType: 'site_settings',
      targetId: '1',
      details: request.body || {}
    });

    return reply.status(200).send({ data: updatedSettings });
  });
}

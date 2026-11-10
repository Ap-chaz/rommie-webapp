import { roomsService, AppError } from '../services/rooms.service.js';
import { db } from '../db/db.js';

export default async function roomsRoutes(fastify, opts) {
  /**
   * Helper for optional authentication (e.g. for contact clicks).
   */
  async function tryAuthenticate(request) {
    try {
      let token = null;
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else if (request.cookies && request.cookies.rommie_token) {
        token = request.cookies.rommie_token;
      }
      if (token) {
        const decoded = fastify.jwt.verify(token);
        const user = await db.findUserById(decoded.sub || decoded.id);
        if (user) {
          request.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: Boolean(user.emailVerified),
            isSuspended: Boolean(user.isSuspended)
          };
        }
      }
    } catch {
      // Optional auth: swallow errors so unauthenticated callers proceed
    }
  }

  // 1. List rooms with filters
  fastify.get('/', async (request, reply) => {
    const rooms = await roomsService.listRooms(request.query || {});
    const limit = Number(request.query?.limit || 50);
    const offset = Number(request.query?.offset || 0);

    reply.status(200).send({
      data: rooms,
      pagination: {
        total: rooms.length,
        limit,
        offset,
        hasMore: false
      }
    });
  });

  // 2. Get room by ID
  fastify.get('/:id', async (request, reply) => {
    const room = await roomsService.getRoomById(request.params.id);
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
    reply.status(200).send(room);
  });

  // 3. Get sibling rooms in same building
  fastify.get('/:id/building', async (request, reply) => {
    const room = await db.findRoomById(request.params.id);
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

    const siblings = await roomsService.getBuildingRooms(room.buildingId, room.id);
    reply.status(200).send(siblings);
  });

  // 4. Create room listing (requires caretaker or admin, authenticated, email verified)
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate, fastify.requireRole('caretaker', 'admin'), fastify.requireEmailVerified()]
    },
    async (request, reply) => {
      const room = await roomsService.createRoom(request.user, request.body || {});
      reply.status(201).send(room);
    }
  );

  // 5. Update room listing (requires owner caretaker or admin)
  fastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate, fastify.requireRole('caretaker', 'admin')]
    },
    async (request, reply) => {
      const updated = await roomsService.updateRoom(request.params.id, request.user, request.body || {});
      reply.status(200).send(updated);
    }
  );

  // 6. Toggle room occupancy status (Vacant / Taken)
  fastify.patch(
    '/:id/status',
    {
      preHandler: [fastify.authenticate, fastify.requireRole('caretaker', 'admin')]
    },
    async (request, reply) => {
      const updated = await roomsService.toggleRoomStatus(request.params.id, request.user, request.body?.status);
      reply.status(200).send({
        id: updated.id,
        status: updated.status,
        lastConfirmedVacantAt: updated.lastConfirmedVacantAt
      });
    }
  );

  // 7. Reconfirm room vacancy (refresh 14-day freshness)
  fastify.post(
    '/:id/reconfirm',
    {
      preHandler: [fastify.authenticate, fastify.requireRole('caretaker', 'admin')]
    },
    async (request, reply) => {
      const updated = await roomsService.reconfirmRoom(request.params.id, request.user);
      reply.status(200).send({
        id: updated.id,
        status: updated.status,
        hidden: updated.hidden,
        lastConfirmedVacantAt: updated.lastConfirmedVacantAt
      });
    }
  );

  // 8. Delete room listing (requires owner caretaker or admin)
  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate, fastify.requireRole('caretaker', 'admin')]
    },
    async (request, reply) => {
      const result = await roomsService.deleteRoom(request.params.id, request.user);
      reply.status(200).send(result);
    }
  );

  // 9. Record contact event (optional authentication)
  fastify.post(
    '/:id/contact',
    {
      preHandler: async (request) => {
        await tryAuthenticate(request);
      }
    },
    async (request, reply) => {
      const result = await roomsService.recordContact(request.params.id, request.user, request.body?.channel);
      reply.status(200).send(result);
    }
  );
}

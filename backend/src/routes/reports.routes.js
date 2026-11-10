import { db } from '../db/db.js';

export default async function (fastify, opts) {
  // POST /api/v1/reports -> allows reporting a room (student or public user)
  fastify.post('/', async (request, reply) => {
    const { roomId, reason, note } = request.body || {};

    if (!roomId) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Room ID is required.',
          field: 'roomId',
          details: []
        }
      });
    }

    const room = await db.findRoomById(roomId);
    if (!room) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Room not found.',
          field: 'roomId',
          details: []
        }
      });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Report reason is required.',
          field: 'reason',
          details: []
        }
      });
    }

    // Try to extract user ID if authenticated token is provided
    let userId = request.user?.id || null;
    if (!userId) {
      const authHeader = request.headers.authorization;
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else if (request.cookies && request.cookies.rommie_token) {
        token = request.cookies.rommie_token;
      }
      if (token) {
        try {
          const decoded = fastify.jwt.verify(token);
          const user = await db.findUserById(decoded.sub || decoded.id);
          if (user) {
            userId = user.id;
          }
        } catch {
          // Unauthenticated or invalid token is acceptable for public report submission
        }
      }
    }

    const report = await db.createReport({
      roomId,
      userId,
      reason: reason.trim(),
      note: note ? String(note).trim() : ''
    });

    return reply.status(201).send({
      data: report,
      message: 'Report submitted for moderation'
    });
  });
}

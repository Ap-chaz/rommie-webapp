import { db } from '../db/db.js';
import { roomsService, enrichRoom } from '../services/rooms.service.js';

export default async function (fastify, opts) {
  // All saved routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/saved -> returns array of saved room IDs for current user
  fastify.get('/', async (request, reply) => {
    const roomIds = await db.getSavedRoomIds(request.user.id);
    return reply.send({ data: roomIds });
  });

  // GET /api/v1/saved/rooms -> returns full room details for saved rooms
  fastify.get('/rooms', async (request, reply) => {
    const roomIds = await db.getSavedRoomIds(request.user.id);
    const rooms = [];
    for (const id of roomIds) {
      let room = await roomsService.getRoomById(id);
      if (!room) {
        const raw = await db.findRoomById(id);
        if (raw && !raw.hidden) {
          room = await enrichRoom(raw);
        }
      }
      if (room) {
        rooms.push(room);
      }
    }
    return reply.send({ data: rooms });
  });

  // POST /api/v1/saved/:roomId -> saves room for user
  fastify.post('/:roomId', async (request, reply) => {
    const { roomId } = request.params;
    const room = await db.findRoomById(roomId);
    if (!room) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found.',
          field: 'roomId'
        }
      });
    }
    await db.saveRoom(request.user.id, roomId);
    return reply.send({ success: true, saved: true });
  });

  // DELETE /api/v1/saved/:roomId -> unsaves room for user
  fastify.delete('/:roomId', async (request, reply) => {
    const { roomId } = request.params;
    await db.unsaveRoom(request.user.id, roomId);
    return reply.send({ success: true, saved: false });
  });
}

import { db } from '../db/db.js';

export default async function (fastify, opts) {
  // All alert routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/alerts -> returns active alerts for current user
  fastify.get('/', async (request, reply) => {
    const alerts = await db.getAlerts(request.user.id);
    return reply.send({ data: alerts });
  });

  // POST /api/v1/alerts -> creates vacancy alert (requires email verification)
  fastify.post('/', async (request, reply) => {
    if (!request.user.emailVerified) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Email verification required to receive alerts',
          field: 'emailVerified',
          details: []
        }
      });
    }

    const { area, roomType, maxRentKes } = request.body || {};
    const alert = await db.createAlert({
      userId: request.user.id,
      area: area || null,
      roomType: roomType || null,
      maxRentKes: maxRentKes !== undefined && maxRentKes !== null ? Number(maxRentKes) : null
    });

    return reply.status(201).send({ data: alert });
  });

  // PATCH /api/v1/alerts/:id -> update alert preferences / active state
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params;
    const alert = await db.findAlertById(id);
    if (!alert) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Alert not found.',
          field: 'id',
          details: []
        }
      });
    }

    if (alert.userId !== request.user.id) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to modify this alert.',
          field: null,
          details: []
        }
      });
    }

    const { active, area, roomType, maxRentKes } = request.body || {};
    const updates = {};
    if (active !== undefined) updates.active = Boolean(active);
    if (area !== undefined) updates.area = area;
    if (roomType !== undefined) updates.roomType = roomType;
    if (maxRentKes !== undefined) updates.maxRentKes = maxRentKes !== null ? Number(maxRentKes) : null;

    const updatedAlert = await db.updateAlert(id, updates);
    return reply.send({ data: updatedAlert });
  });

  // DELETE /api/v1/alerts/:id -> delete alert
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    const alert = await db.findAlertById(id);
    if (!alert) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Alert not found.',
          field: 'id',
          details: []
        }
      });
    }

    if (alert.userId !== request.user.id) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to delete this alert.',
          field: null,
          details: []
        }
      });
    }

    await db.deleteAlert(id);
    return reply.send({ success: true });
  });
}

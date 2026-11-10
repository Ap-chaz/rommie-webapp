import { db } from '../db/db.js';

export default async function (fastify, opts) {
  // GET /api/v1/caretakers/profile
  // Requires authentication. Role must be caretaker or admin.
  fastify.get('/profile', {
    preHandler: async (request, reply) => {
      await fastify.authenticate(request, reply);
      if (reply.sent) return;
      await fastify.requireRole('caretaker', 'admin')(request, reply);
    }
  }, async (request, reply) => {
    const profile = await db.getCaretakerProfileData(request.user.id);
    if (!profile) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Caretaker profile not found.',
          field: null,
          details: []
        }
      });
    }

    return reply.status(200).send({
      data: profile
    });
  });

  // GET /api/v1/caretakers/:id
  // Can be accessed by ID (authenticated or public/admin)
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    if (!id || id === 'profile') {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid caretaker ID.',
          field: 'id',
          details: []
        }
      });
    }

    const profile = await db.getCaretakerProfileData(id);
    if (!profile) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Caretaker not found.',
          field: null,
          details: []
        }
      });
    }

    return reply.status(200).send({
      data: profile
    });
  });
}

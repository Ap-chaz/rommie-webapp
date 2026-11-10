import { db } from '../db/db.js';

export default async function (fastify, opts) {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/verification/caretaker
  fastify.get('/caretaker', async (request, reply) => {
    const verificationReq = await db.getVerificationRequest(request.user.id);
    return reply.status(200).send({
      data: verificationReq || { status: 'unsubmitted' }
    });
  });

  // POST /api/v1/verification/caretaker
  fastify.post('/caretaker', async (request, reply) => {
    const { documentUrl, documentName } = request.body || {};

    if (!documentUrl || typeof documentUrl !== 'string' || !documentUrl.trim()) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'documentUrl is required.',
          field: 'documentUrl',
          details: []
        }
      });
    }

    const existing = await db.getVerificationRequest(request.user.id);
    if (existing && existing.status === 'pending') {
      return reply.status(409).send({
        error: {
          code: 'CONFLICT',
          message: 'Verification request already pending review',
          field: null,
          details: []
        }
      });
    }

    const created = await db.createVerificationRequest({
      userId: request.user.id,
      documentUrl: documentUrl.trim(),
      documentName: documentName ? String(documentName).trim() : 'National ID / Passport'
    });

    return reply.status(201).send({
      data: created
    });
  });
}

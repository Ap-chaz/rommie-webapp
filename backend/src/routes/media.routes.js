import path from 'path';
import { AppError } from '../services/rooms.service.js';
import { r2Service } from '../services/r2.service.js';

export default async function mediaRoutes(fastify, opts) {
  // 1. Direct file upload to Cloudflare R2 bucket (multipart form-data or JSON dataUrl)
  fastify.post('/upload', async (request, reply) => {
    // A) If multipart form data
    if (request.isMultipart()) {
      const part = await request.file();
      if (!part) {
        throw new AppError('No file uploaded', 400, 'BAD_REQUEST', 'file');
      }
      const rawExt = path.extname(part.filename || '') || '.webp';
      const ext = rawExt.toLowerCase().replace(/[^a-z0-9.]/g, '') || '.webp';
      const filename = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const key = `rooms/${filename}`;

      const buffer = await part.toBuffer();
      const result = await r2Service.uploadBuffer({
        buffer,
        key,
        contentType: part.mimetype || 'image/webp'
      });

      return reply.status(201).send({
        success: true,
        url: result.url,
        key: result.key,
        filename
      });
    }

    // B) If JSON body with base64 / dataUrl
    const { dataUrl } = request.body || {};
    if (dataUrl && typeof dataUrl === 'string') {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = mimeType.includes('pdf')
          ? '.pdf'
          : mimeType.includes('png')
          ? '.png'
          : mimeType.includes('jpeg') || mimeType.includes('jpg')
          ? '.jpg'
          : '.webp';
        const filename = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        const key = mimeType.includes('pdf') ? `documents/${filename}` : `rooms/${filename}`;

        const result = await r2Service.uploadBuffer({
          buffer,
          key,
          contentType: mimeType
        });

        return reply.status(201).send({
          success: true,
          url: result.url,
          key: result.key,
          filename
        });
      }
    }

    throw new AppError('Expected multipart file or base64 dataUrl', 400, 'BAD_REQUEST', 'file');
  });

  /**
   * POST /presign-upload
   * Accepts { filename, fileType, kind } ('room-photo' or 'kyc-document').
   * Validates user authenticated.
   * Returns { uploadUrl: ..., fileUrl: ..., key: ... } for direct Cloudflare R2 upload.
   */
  fastify.post(
    '/presign-upload',
    {
      preHandler: [fastify.authenticate]
    },
    async (request, reply) => {
      const { filename, fileType, kind } = request.body || {};

      if (!filename || typeof filename !== 'string' || !filename.trim()) {
        throw new AppError('Filename is required', 400, 'BAD_REQUEST', 'filename');
      }

      const cleanFilename = filename.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
      const result = await r2Service.getPresignedUploadUrl({
        key: cleanFilename,
        contentType: fileType || 'image/webp',
        kind: kind || 'room-photo'
      });

      reply.status(200).send({
        uploadUrl: result.uploadUrl,
        fileUrl: result.fileUrl,
        key: result.key
      });
    }
  );
}

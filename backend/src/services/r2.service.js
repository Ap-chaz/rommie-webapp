import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';

export class R2Service {
  constructor() {
    this.client = null;
    this.initClient();
  }

  initClient() {
    if (config.r2AccessKeyId && config.r2SecretAccessKey) {
      let rawEndpoint =
        config.r2Endpoint ||
        (config.r2AccountId
          ? `https://${config.r2AccountId}.r2.cloudflarestorage.com`
          : undefined);

      // Normalize endpoint: strip bucket suffix if present so S3Client formats paths accurately
      if (rawEndpoint) {
        if (config.r2BucketName && rawEndpoint.endsWith(`/${config.r2BucketName}`)) {
          rawEndpoint = rawEndpoint.slice(0, -(config.r2BucketName.length + 1));
        } else if (/\.r2\.cloudflarestorage\.com\/[^\/]+$/.test(rawEndpoint)) {
          rawEndpoint = rawEndpoint.replace(/\/[^\/]+$/, '');
        }
      }

      this.client = new S3Client({
        region: 'auto',
        endpoint: rawEndpoint,
        credentials: {
          accessKeyId: config.r2AccessKeyId,
          secretAccessKey: config.r2SecretAccessKey
        }
      });
    }
  }

  isConfigured() {
    return Boolean(this.client);
  }

  getPublicUrl(key) {
    const cleanKey = String(key || '').replace(/^\/+/, '');
    const base = config.r2PublicUrl ? config.r2PublicUrl.replace(/\/+$/, '') : 'https://cdn.rommie.co.ke';
    return `${base}/${cleanKey}`;
  }

  /**
   * Directly upload a file buffer to Cloudflare R2 bucket.
   */
  async uploadBuffer({ buffer, key, contentType = 'image/webp' }) {
    const cleanKey = String(key || '').replace(/^\/+/, '');
    const publicUrl = this.getPublicUrl(cleanKey);

    if (this.client) {
      const command = new PutObjectCommand({
        Bucket: config.r2BucketName,
        Key: cleanKey,
        Body: buffer,
        ContentType: contentType
      });
      await this.client.send(command);
    }

    return {
      success: true,
      url: publicUrl,
      key: cleanKey
    };
  }

  /**
   * Generate an S3 presigned PUT URL for direct browser-to-R2 upload.
   */
  async getPresignedUploadUrl({ key, contentType = 'image/webp', kind = 'room-photo', expiresIn = 900 }) {
    const cleanKey = String(key || '').replace(/^\/+/, '');
    const fullKey = cleanKey.startsWith('rooms/') || cleanKey.startsWith('documents/') || cleanKey.startsWith('uploads/')
      ? cleanKey
      : (kind === 'kyc-document' ? `documents/${cleanKey}` : `rooms/${cleanKey}`);

    const fileUrl = this.getPublicUrl(fullKey);

    if (this.client) {
      const command = new PutObjectCommand({
        Bucket: config.r2BucketName,
        Key: fullKey,
        ContentType: contentType
      });
      const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
      return {
        uploadUrl,
        fileUrl,
        key: fullKey
      };
    }

    // Dev/test fallback when R2 credentials are not set
    const baseUpload = config.r2PublicUrl ? config.r2PublicUrl.replace(/\/+$/, '') : 'https://cdn.rommie.co.ke';
    return {
      uploadUrl: `${baseUpload}/uploads/mock/${cleanKey}`,
      fileUrl,
      key: fullKey
    };
  }

  /**
   * Delete an object from Cloudflare R2 bucket.
   */
  async deleteObject({ key }) {
    const cleanKey = String(key || '').replace(/^\/+/, '');
    if (this.client) {
      const command = new DeleteObjectCommand({
        Bucket: config.r2BucketName,
        Key: cleanKey
      });
      await this.client.send(command);
    }
    return { success: true, key: cleanKey };
  }
}

export const r2Service = new R2Service();
export default r2Service;

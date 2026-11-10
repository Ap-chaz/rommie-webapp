import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { r2Service } from '../services/r2.service.js';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('🚀 Starting Cloudflare R2 image generation and upload...');
  console.log(`📦 Bucket: ${config.r2BucketName}`);
  console.log(`🌐 Public URL Base: ${config.r2PublicUrl}`);
  console.log(`🔗 Endpoint: ${config.r2Endpoint}`);

  if (!r2Service.isConfigured()) {
    console.error('❌ Cloudflare R2 is not configured. Check R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in .env.');
    process.exit(1);
  }

  // 1. Gather all local source images
  const sourceImages = [];

  // A) From src/assets
  const assetsDir = path.resolve(__dirname, '../../../src/assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'));
    for (const f of assetFiles) {
      const buffer = fs.readFileSync(path.join(assetsDir, f));
      sourceImages.push({ name: f, buffer, contentType: 'image/jpeg' });
    }
  }

  // B) From backend/uploads
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  if (fs.existsSync(uploadsDir)) {
    const uploadFiles = fs
      .readdirSync(uploadsDir)
      .filter((f) => !f.startsWith('.') && (f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp')));
    for (const f of uploadFiles) {
      const filePath = path.join(uploadsDir, f);
      const stat = fs.statSync(filePath);
      if (stat.size > 1000) {
        // filter out empty/tiny dummy files
        const buffer = fs.readFileSync(filePath);
        const contentType = f.endsWith('.png') ? 'image/png' : 'image/jpeg';
        sourceImages.push({ name: f, buffer, contentType });
      }
    }
  }

  console.log(`📸 Found ${sourceImages.length} authentic source room images.`);
  if (sourceImages.length === 0) {
    console.error('❌ No source images found.');
    process.exit(1);
  }

  // 2. Prepare upload targets
  const uploadsToPerform = [];

  // A) Core asset room images
  for (let i = 1; i <= 4; i++) {
    const img = sourceImages[(i - 1) % sourceImages.length];
    uploadsToPerform.push({
      key: `rooms/room-${i}.jpg`,
      buffer: img.buffer,
      contentType: 'image/jpeg'
    });
  }

  // Common fallbacks
  uploadsToPerform.push({
    key: 'rooms/default.webp',
    buffer: sourceImages[0].buffer,
    contentType: 'image/jpeg'
  });
  uploadsToPerform.push({
    key: 'rooms/photo1.webp',
    buffer: sourceImages[1 % sourceImages.length].buffer,
    contentType: 'image/jpeg'
  });
  uploadsToPerform.push({
    key: 'rooms/bedroom.webp',
    buffer: sourceImages[2 % sourceImages.length].buffer,
    contentType: 'image/jpeg'
  });

  // KYC Verification Documents
  uploadsToPerform.push({
    key: 'documents/national-id.png',
    buffer: sourceImages[0].buffer,
    contentType: 'image/jpeg'
  });
  uploadsToPerform.push({
    key: 'documents/student-id.png',
    buffer: sourceImages[1 % sourceImages.length].buffer,
    contentType: 'image/jpeg'
  });

  // B) All room listings and hostel listings in the app
  const roomSlugs = [
    'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10', 'h11', 'h12', 'h13', 'h14', 'h15', 'h16',
    'ksl-bedsitter-1', 'cuea-single-1', 'rongai-onebed-1', 'karen-hostel-1'
  ];

  const standardPhotoNames = [
    '01-main-room.webp',
    '02-opposite-angle.webp',
    '03-bed-living.webp',
    '04-bathroom.webp',
    '05-kitchen.webp',
    '06-closet.webp',
    '07-window-meter.webp',
    '08-exterior-gate.webp',
    '09-balcony-corridor.webp',
    '10-security.webp'
  ];

  let imageIndex = 0;
  for (const slug of roomSlugs) {
    for (let pIdx = 0; pIdx < standardPhotoNames.length; pIdx++) {
      const photoName = standardPhotoNames[pIdx];
      const img = sourceImages[imageIndex % sourceImages.length];
      imageIndex++;

      uploadsToPerform.push({
        key: `rooms/${slug}/${photoName}`,
        buffer: img.buffer,
        contentType: 'image/jpeg'
      });
    }
  }

  console.log(`⏳ Total files to upload to Cloudflare R2: ${uploadsToPerform.length}`);

  // 3. Upload with controlled concurrency
  const CONCURRENCY = 6;
  let completed = 0;
  let failed = 0;

  async function uploadWorker(items) {
    while (items.length > 0) {
      const item = items.shift();
      if (!item) break;
      try {
        await r2Service.uploadBuffer({
          buffer: item.buffer,
          key: item.key,
          contentType: item.contentType
        });
        completed++;
        if (completed % 25 === 0 || completed === uploadsToPerform.length) {
          console.log(`✅ Uploaded ${completed}/${uploadsToPerform.length} (${Math.round((completed / uploadsToPerform.length) * 100)}%)`);
        }
      } catch (err) {
        failed++;
        console.error(`❌ Failed uploading ${item.key}:`, err.message);
      }
    }
  }

  const queue = [...uploadsToPerform];
  const workers = Array.from({ length: CONCURRENCY }, () => uploadWorker(queue));
  await Promise.all(workers);

  console.log('\n🎉 Finished R2 Upload Process!');
  console.log(`📊 Succeeded: ${completed}`);
  console.log(`⚠️ Failed: ${failed}`);

  // 4. Verification Check
  const sampleKeys = [
    'rooms/r1/01-main-room.webp',
    'rooms/r2/01-main-room.webp',
    'rooms/h1/01-main-room.webp',
    'documents/national-id.png'
  ];

  console.log('\n🔍 Verifying sample public URLs on R2...');
  for (const key of sampleKeys) {
    const url = r2Service.getPublicUrl(key);
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`  ${res.status === 200 ? '✅ 200 OK' : `❌ ${res.status}`}: ${url} (${res.headers.get('content-type')}, ${res.headers.get('content-length')} bytes)`);
    } catch (e) {
      console.log(`  ❌ Network error on ${url}:`, e.message);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error running R2 upload script:', err);
  process.exit(1);
});

import { db } from '../db/db.js';
import { calculateTrustScore } from './trust.service.js';

export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', field = null, details = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.details = details;
  }
}

/**
 * Enriches a room object with caretaker details and trust score.
 */
export async function enrichRoom(room) {
  if (!room) return null;
  const caretaker = room.caretakerId ? await db.findCaretakerById(room.caretakerId) : null;
  const reportsCount = await db.countOpenReportsForRoom(room.id);
  const trust = calculateTrustScore(caretaker, room, reportsCount);

  const formattedCaretaker = caretaker
    ? {
        id: caretaker.id,
        name: caretaker.name,
        phone: caretaker.phone,
        verified: Boolean(caretaker.isVerified || caretaker.verified),
        isVerified: Boolean(caretaker.isVerified || caretaker.verified),
        trustScore: trust.score,
        joinedAt: caretaker.joinedAt
      }
    : {
        id: 'unknown',
        name: 'Caretaker',
        phone: '',
        verified: false,
        isVerified: false,
        trustScore: 50,
        joinedAt: new Date().toISOString()
      };

  return {
    ...room,
    caretaker: formattedCaretaker,
    trustScore: trust.score,
    trust
  };
}

export const roomsService = {
  enrichRoom,
  /**
   * List rooms based on filters and calculate trust scores.
   */
  async listRooms(filters = {}) {
    const sanitizedFilters = { ...filters };

    // Handle query param conversions
    if (typeof sanitizedFilters.amenities === 'string') {
      sanitizedFilters.amenities = [sanitizedFilters.amenities];
    }
    if (sanitizedFilters.minRent !== undefined) {
      sanitizedFilters.minRent = Number(sanitizedFilters.minRent);
    }
    if (sanitizedFilters.maxRent !== undefined) {
      sanitizedFilters.maxRent = Number(sanitizedFilters.maxRent);
    }
    if (sanitizedFilters.vacantOnly === 'true' || sanitizedFilters.vacantOnly === true) {
      sanitizedFilters.vacantOnly = true;
    } else if (sanitizedFilters.vacantOnly === 'false' || sanitizedFilters.vacantOnly === false) {
      sanitizedFilters.vacantOnly = false;
    }

    const rooms = await db.queryRooms(sanitizedFilters);
    return Promise.all(rooms.map(enrichRoom));
  },

  /**
   * Get room detail by ID. Returns null if not found, hidden, or caretaker suspended.
   */
  async getRoomById(id) {
    const room = await db.findRoomById(id);
    if (!room || room.hidden) {
      return null;
    }

    if (room.caretakerId && (await db.isCaretakerSuspended(room.caretakerId))) {
      return null;
    }

    return enrichRoom(room);
  },

  /**
   * Get sibling rooms located in the same building.
   */
  async getBuildingRooms(buildingId, currentRoomId) {
    if (!buildingId) return [];
    const rooms = await db.findRoomsByBuilding(buildingId, currentRoomId);
    return Promise.all(rooms.map(enrichRoom));
  },

  /**
   * Create a new room listing.
   * Requires caretaker emailVerified === true.
   * Validates exactly 10 photos.
   * Validates title, roomType, rentKes, area.
   */
  async createRoom(caretakerUser, roomPayload) {
    if (!caretakerUser || !caretakerUser.emailVerified) {
      throw new AppError('Email verification required before creating listings.', 403, 'FORBIDDEN', 'emailVerified');
    }

    // Validate 10 photos requirement strictly
    if (!Array.isArray(roomPayload?.photos) || roomPayload.photos.length !== 10) {
      throw new AppError('Exactly 10 photos are required', 422, 'VALIDATION_FAILED', 'photos');
    }

    // Validate required fields
    if (!roomPayload?.title || typeof roomPayload.title !== 'string' || !roomPayload.title.trim()) {
      throw new AppError('Title is required', 422, 'VALIDATION_FAILED', 'title');
    }
    if (!roomPayload?.roomType) {
      throw new AppError('Room type is required', 422, 'VALIDATION_FAILED', 'roomType');
    }
    if (
      roomPayload?.rentKes === undefined ||
      roomPayload?.rentKes === null ||
      isNaN(Number(roomPayload.rentKes)) ||
      Number(roomPayload.rentKes) <= 0
    ) {
      throw new AppError('Valid rentKes is required', 422, 'VALIDATION_FAILED', 'rentKes');
    }
    if (!roomPayload?.area || typeof roomPayload.area !== 'string' || !roomPayload.area.trim()) {
      throw new AppError('Area is required', 422, 'VALIDATION_FAILED', 'area');
    }

    // Ensure caretaker profile exists in data store
    let ct = await db.findCaretakerById(caretakerUser.id);
    if (!ct) {
      ct = await db.createCaretaker({
        id: caretakerUser.id,
        name: caretakerUser.name || 'Caretaker',
        phone: caretakerUser.phone || roomPayload.whatsappNumber || roomPayload.callNumber || '',
        isVerified: false,
        isSuspended: false,
        joinedAt: new Date().toISOString()
      });
    }

    if (ct.isSuspended) {
      throw new AppError('Suspended caretakers cannot post listings.', 403, 'FORBIDDEN');
    }

    const newRoomData = {
      ...roomPayload,
      caretakerId: caretakerUser.id,
      whatsappNumber: roomPayload.whatsappNumber || caretakerUser.phone || '',
      callNumber: roomPayload.callNumber || caretakerUser.phone || '',
      status: roomPayload.status || 'Vacant',
      lastConfirmedVacantAt: roomPayload.lastConfirmedVacantAt || new Date().toISOString(),
      hidden: false
    };

    const created = await db.createRoom(newRoomData);
    return enrichRoom(created);
  },

  /**
   * Update room listing.
   */
  async updateRoom(roomId, caretakerUser, updates) {
    const room = await db.findRoomById(roomId);
    if (!room) {
      throw new AppError('Listing not found', 404, 'NOT_FOUND');
    }

    const isOwner = room.caretakerId === caretakerUser.id;
    const isAdmin = caretakerUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Access denied: You do not own this listing.', 403, 'FORBIDDEN');
    }

    if (!isAdmin && (await db.isCaretakerSuspended(room.caretakerId))) {
      throw new AppError('Caretaker account is suspended.', 403, 'FORBIDDEN');
    }

    if (updates.photos !== undefined) {
      if (!Array.isArray(updates.photos) || updates.photos.length !== 10) {
        throw new AppError('Exactly 10 photos are required', 422, 'VALIDATION_FAILED', 'photos');
      }
    }

    const updated = await db.updateRoom(roomId, updates);
    return enrichRoom(updated);
  },

  /**
   * Toggle room occupancy status (Vacant / Taken).
   * Refreshes lastConfirmedVacantAt when set to Vacant.
   */
  async toggleRoomStatus(roomId, caretakerUser, newStatus) {
    const room = await db.findRoomById(roomId);
    if (!room) {
      throw new AppError('Listing not found', 404, 'NOT_FOUND');
    }

    const isOwner = room.caretakerId === caretakerUser.id;
    const isAdmin = caretakerUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Access denied: You do not own this listing.', 403, 'FORBIDDEN');
    }

    if (!isAdmin && (await db.isCaretakerSuspended(room.caretakerId))) {
      throw new AppError('Caretaker account is suspended.', 403, 'FORBIDDEN');
    }

    const targetStatus = newStatus || (room.status === 'Vacant' ? 'Taken' : 'Vacant');
    const updateData = { status: targetStatus };
    if (targetStatus === 'Vacant') {
      updateData.lastConfirmedVacantAt = new Date().toISOString();
    }

    const updated = await db.updateRoom(roomId, updateData);
    return enrichRoom(updated);
  },

  /**
   * Reconfirm room vacancy freshness.
   * Sets lastConfirmedVacantAt to now(), unhides listing if hidden, sets status to Vacant.
   */
  async reconfirmRoom(roomId, caretakerUser) {
    const room = await db.findRoomById(roomId);
    if (!room) {
      throw new AppError('Listing not found', 404, 'NOT_FOUND');
    }

    const isOwner = room.caretakerId === caretakerUser.id;
    const isAdmin = caretakerUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Access denied: You do not own this listing.', 403, 'FORBIDDEN');
    }

    if (!isAdmin && (await db.isCaretakerSuspended(room.caretakerId))) {
      throw new AppError('Caretaker account is suspended.', 403, 'FORBIDDEN');
    }

    const updateData = {
      lastConfirmedVacantAt: new Date().toISOString(),
      hidden: false,
      status: 'Vacant'
    };

    const updated = await db.updateRoom(roomId, updateData);
    return enrichRoom(updated);
  },

  /**
   * Permanently delete room listing.
   */
  async deleteRoom(roomId, caretakerUser) {
    const room = await db.findRoomById(roomId);
    if (!room) {
      throw new AppError('Listing not found', 404, 'NOT_FOUND');
    }

    const isOwner = room.caretakerId === caretakerUser.id;
    const isAdmin = caretakerUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Access denied: You do not own this listing.', 403, 'FORBIDDEN');
    }

    await db.deleteRoom(roomId);
    return { success: true };
  },

  /**
   * Record contact telemetry (WhatsApp / Call tap) with 30-second deduplication.
   */
  async recordContact(roomId, user, channel) {
    const room = await db.findRoomById(roomId);
    if (!room) {
      throw new AppError('Listing not found', 404, 'NOT_FOUND');
    }

    if (!channel || !['whatsapp', 'call'].includes(channel)) {
      throw new AppError('Channel must be either whatsapp or call', 400, 'BAD_REQUEST', 'channel');
    }

    // Bypass recording for admins and the room owner
    if (user && (user.role === 'admin' || user.id === room.caretakerId)) {
      return { tracked: false, bypassed: true };
    }

    // Check 30-second deduplication window per room + channel
    const isDupe = await db.isContactDeduplicated(roomId, channel, 30000);
    if (isDupe) {
      return { tracked: false, deduplicated: true };
    }

    await db.recordContactEvent({
      roomId,
      userId: user?.id || null,
      channel
    });

    return { tracked: true };
  }
};

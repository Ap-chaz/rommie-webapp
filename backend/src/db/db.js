import { config } from '../config.js';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { computeTrust } from '../services/trust.service.js';

const { Pool } = pg;

export class Database {
  constructor(options = {}) {
    const dbUrl = options.databaseUrl || (process.env.NODE_ENV === 'test' ? '' : config.databaseUrl);
    this.usePostgres = Boolean(dbUrl);
    this.pool = this.usePostgres
      ? new Pool({
          connectionString: dbUrl,
          ssl: dbUrl.includes('sslmode=require') || dbUrl.includes('supabase.co') || dbUrl.includes('neon.tech')
            ? { rejectUnauthorized: false }
            : false
        })
      : null;

    // In-memory data store for testing and zero-dependency execution
    this.state = {
      users: new Map(),
      caretakers: new Map(),
      rooms: new Map(),
      roomOptions: new Map(),
      savedRooms: new Map(), // key: `${userId}:${roomId}`
      vacancyAlerts: new Map(),
      reports: new Map(),
      verificationRequests: new Map(),
      activityEntries: [],
      contactEvents: [],
      siteSettings: {
        id: 1,
        whatsapp: '+254711223344',
        phone: '+254711223344',
        email: 'hello@rommie.co.ke',
        hours: 'Mon-Sat, 8am - 6pm EAT',
        location: 'Karen / Rongai, Nairobi, Kenya',
        updatedAt: new Date().toISOString()
      },
      emailOtps: new Map() // email -> array of otp attempts
    };
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  clear() {
    this.state.users.clear();
    this.state.caretakers.clear();
    this.state.rooms.clear();
    this.state.roomOptions.clear();
    this.state.savedRooms.clear();
    this.state.vacancyAlerts.clear();
    this.state.reports.clear();
    this.state.verificationRequests.clear();
    this.state.activityEntries = [];
    this.state.contactEvents = [];
    this.state.emailOtps.clear();
  }

  // --- Row Mappers for PostgreSQL ---
  _mapUserRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      passwordHash: row.password_hash,
      name: row.name,
      firstName: row.first_name,
      lastName: row.last_name,
      school: row.school,
      role: row.role,
      emailVerified: Boolean(row.email_verified),
      isGoogle: Boolean(row.is_google),
      isSuspended: Boolean(row.is_suspended),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  _mapCaretakerRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      isVerified: Boolean(row.is_verified),
      isSuspended: Boolean(row.is_suspended),
      joinedAt: row.joined_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  _mapRoomRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      roomType: row.room_type,
      rentKes: Number(row.rent_kes),
      depositTerms: row.deposit_terms,
      area: row.area,
      distances: typeof row.distances === 'string' ? JSON.parse(row.distances) : (row.distances || {}),
      matatuFareKes: Number(row.matatu_fare_kes || 0),
      amenities: Array.isArray(row.amenities) ? row.amenities : [],
      photos: Array.isArray(row.photos) ? row.photos : [],
      mapLink: row.map_link,
      status: row.status,
      lastConfirmedVacantAt: row.last_confirmed_vacant_at,
      whatsappNumber: row.whatsapp_number,
      callNumber: row.call_number,
      caretakerId: row.caretaker_id,
      buildingId: row.building_id,
      hidden: Boolean(row.hidden),
      gender: row.gender,
      meals: Boolean(row.meals),
      transport: Boolean(row.transport),
      distanceKm: row.distance_km ? Number(row.distance_km) : null,
      registrationFee: row.registration_fee ? Number(row.registration_fee) : 0,
      inGuide: Boolean(row.in_guide),
      roomOptions: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // --- Users ---
  async findUserById(id) {
    if (!id) return null;
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE id = $1;', [id]);
        if (res.rows.length > 0) return this._mapUserRow(res.rows[0]);
      } catch (err) {
        console.error('[DB:findUserById] Postgres error:', err.message);
      }
    }
    return this.state.users.get(id) || null;
  }

  async findUserByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1);', [normalized]);
        if (res.rows.length > 0) return this._mapUserRow(res.rows[0]);
      } catch (err) {
        console.error('[DB:findUserByEmail] Postgres error:', err.message);
      }
    }
    for (const user of this.state.users.values()) {
      if (user.email.toLowerCase() === normalized) return user;
    }
    return null;
  }

  async findUserByPhone(phone) {
    if (!phone) return null;
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE phone = $1;', [phone]);
        if (res.rows.length > 0) return this._mapUserRow(res.rows[0]);
      } catch (err) {
        console.error('[DB:findUserByPhone] Postgres error:', err.message);
      }
    }
    for (const user of this.state.users.values()) {
      if (user.phone === phone) return user;
    }
    return null;
  }

  async _ensureUserInPostgres(userId) {
    if (!this.usePostgres || !userId) return;
    try {
      const res = await this.pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1;', [userId]);
      if (res.rows.length > 0) return;

      const memUser = this.state.users.get(userId);
      const email = memUser?.email ? memUser.email.toLowerCase().trim() : `${userId}@user.rommie.co.ke`;
      const name = memUser?.name || 'Rommie User';
      const role = memUser?.role || 'student';
      const cleanPhone = memUser?.phone && memUser.phone.trim() ? memUser.phone.trim() : null;

      // Check if email already exists with another ID
      const emailRes = await this.pool.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1;', [email]);
      if (emailRes.rows.length > 0) {
        // Avoid duplicate email collision; use fallback unique email for this user id row
        const fallbackEmail = `${userId}@user.rommie.co.ke`;
        await this.pool.query(
          `INSERT INTO users (id, email, phone, name, role, email_verified, is_google, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, false, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING;`,
          [userId, fallbackEmail, null, name, role]
        );
      } else {
        await this.pool.query(
          `INSERT INTO users (id, email, phone, name, role, email_verified, is_google, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, false, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING;`,
          [userId, email, cleanPhone, name, role]
        );
      }
    } catch (err) {
      console.error('[DB:_ensureUserInPostgres] Postgres error:', err.message);
    }
  }

  async createUser(userData) {
    const id = userData.id || `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const cleanPhone = userData.phone && userData.phone.trim() ? userData.phone.trim() : null;
    const user = {
      id,
      email: userData.email.trim().toLowerCase(),
      phone: cleanPhone,
      passwordHash: userData.passwordHash || null,
      name: userData.name,
      firstName: userData.firstName || userData.name.split(' ')[0] || '',
      lastName: userData.lastName || userData.name.split(' ').slice(1).join(' ') || '',
      school: userData.school || null,
      role: userData.role || 'student',
      emailVerified: Boolean(userData.emailVerified),
      isGoogle: Boolean(userData.isGoogle),
      isSuspended: Boolean(userData.isSuspended),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.usePostgres) {
      try {
        if (user.email) {
          const existing = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1;', [user.email]);
          if (existing.rows.length > 0) {
            const existingRow = existing.rows[0];
            await this.pool.query(
              `UPDATE users SET
                 name = COALESCE(NULLIF($1, ''), name),
                 first_name = COALESCE(NULLIF($2, ''), first_name),
                 last_name = COALESCE(NULLIF($3, ''), last_name),
                 phone = COALESCE($4, phone),
                 email_verified = COALESCE($5, email_verified),
                 is_google = COALESCE($6, is_google),
                 updated_at = NOW()
               WHERE id = $7;`,
              [user.name || null, user.firstName || null, user.lastName || null, cleanPhone, user.emailVerified, user.isGoogle, existingRow.id]
            );
            const updated = this._mapUserRow({
              ...existingRow,
              name: user.name || existingRow.name,
              first_name: user.firstName || existingRow.first_name,
              last_name: user.lastName || existingRow.last_name,
              phone: cleanPhone || existingRow.phone,
              email_verified: user.emailVerified ?? existingRow.email_verified,
              is_google: user.isGoogle ?? existingRow.is_google
            });
            this.state.users.set(existingRow.id, updated);
            if (id !== existingRow.id) {
              this.state.users.set(id, updated);
            }
            return updated;
          }
        }

        await this.pool.query(
          `INSERT INTO users (id, email, phone, password_hash, name, first_name, last_name, school, role, email_verified, is_google, is_suspended, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             password_hash = EXCLUDED.password_hash,
             name = EXCLUDED.name,
             email_verified = EXCLUDED.email_verified,
             is_google = EXCLUDED.is_google,
             updated_at = NOW();`,
          [user.id, user.email, cleanPhone, user.passwordHash, user.name, user.firstName, user.lastName, user.school, user.role, user.emailVerified, user.isGoogle, user.isSuspended, user.createdAt, user.updatedAt]
        );
      } catch (err) {
        console.error('[DB:createUser] Postgres error:', err.message);
      }
    }

    this.state.users.set(id, user);
    return user;
  }

  async updateUser(id, updates) {
    if (this.usePostgres) {
      try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (updates.email !== undefined) { fields.push(`email = $${idx++}`); values.push(updates.email.trim().toLowerCase()); }
        if (updates.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(updates.phone); }
        if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
        if (updates.firstName !== undefined) { fields.push(`first_name = $${idx++}`); values.push(updates.firstName); }
        if (updates.lastName !== undefined) { fields.push(`last_name = $${idx++}`); values.push(updates.lastName); }
        if (updates.school !== undefined) { fields.push(`school = $${idx++}`); values.push(updates.school); }
        if (updates.role !== undefined) { fields.push(`role = $${idx++}`); values.push(updates.role); }
        if (updates.passwordHash !== undefined) { fields.push(`password_hash = $${idx++}`); values.push(updates.passwordHash); }
        if (updates.emailVerified !== undefined) { fields.push(`email_verified = $${idx++}`); values.push(Boolean(updates.emailVerified)); }
        if (updates.isGoogle !== undefined) { fields.push(`is_google = $${idx++}`); values.push(Boolean(updates.isGoogle)); }
        if (updates.isSuspended !== undefined) { fields.push(`is_suspended = $${idx++}`); values.push(Boolean(updates.isSuspended)); }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const res = await this.pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`, values);
        if (res.rows.length > 0) {
          const updated = this._mapUserRow(res.rows[0]);
          this.state.users.set(id, updated);
          return updated;
        }
      } catch (err) {
        console.error('[DB:updateUser] Postgres error:', err.message);
      }
    }

    const user = this.state.users.get(id);
    if (!user) return null;
    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.state.users.set(id, updated);
    return updated;
  }

  async listUsers(roleFilter) {
    if (this.usePostgres) {
      try {
        const sql = roleFilter
          ? 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC;'
          : 'SELECT * FROM users ORDER BY created_at DESC;';
        const params = roleFilter ? [roleFilter] : [];
        const res = await this.pool.query(sql, params);
        return res.rows.map((row) => this._mapUserRow(row));
      } catch (err) {
        console.error('[DB:listUsers] Postgres error:', err.message);
      }
    }
    const all = Array.from(this.state.users.values());
    if (roleFilter) {
      return all.filter((u) => u.role === roleFilter);
    }
    return all;
  }

  // --- Caretakers ---
  async findCaretakerById(id) {
    if (!id) return null;
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM caretakers WHERE id = $1;', [id]);
        if (res.rows.length > 0) return this._mapCaretakerRow(res.rows[0]);
      } catch (err) {
        console.error('[DB:findCaretakerById] Postgres error:', err.message);
      }
    }
    return this.state.caretakers.get(id) || null;
  }

  async createCaretaker(caretakerData) {
    const caretaker = {
      id: caretakerData.id,
      name: caretakerData.name,
      phone: caretakerData.phone,
      isVerified: Boolean(caretakerData.isVerified),
      isSuspended: Boolean(caretakerData.isSuspended),
      joinedAt: caretakerData.joinedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.usePostgres) {
      try {
        await this.pool.query(
          `INSERT INTO caretakers (id, name, phone, is_verified, is_suspended, joined_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             phone = EXCLUDED.phone,
             is_verified = EXCLUDED.is_verified,
             is_suspended = EXCLUDED.is_suspended,
             updated_at = NOW();`,
          [caretaker.id, caretaker.name, caretaker.phone, caretaker.isVerified, caretaker.isSuspended, caretaker.joinedAt, caretaker.createdAt, caretaker.updatedAt]
        );
      } catch (err) {
        console.error('[DB:createCaretaker] Postgres error:', err.message);
      }
    }

    this.state.caretakers.set(caretaker.id, caretaker);
    return caretaker;
  }

  async updateCaretaker(id, updates) {
    if (this.usePostgres) {
      try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
        if (updates.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(updates.phone); }
        if (updates.isVerified !== undefined) { fields.push(`is_verified = $${idx++}`); values.push(Boolean(updates.isVerified)); }
        if (updates.isSuspended !== undefined) { fields.push(`is_suspended = $${idx++}`); values.push(Boolean(updates.isSuspended)); }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const res = await this.pool.query(`UPDATE caretakers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`, values);
        if (res.rows.length > 0) {
          const updated = this._mapCaretakerRow(res.rows[0]);
          this.state.caretakers.set(id, updated);
          return updated;
        }
      } catch (err) {
        console.error('[DB:updateCaretaker] Postgres error:', err.message);
      }
    }

    const ct = this.state.caretakers.get(id);
    if (!ct) return null;
    const updated = {
      ...ct,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.state.caretakers.set(id, updated);
    return updated;
  }

  async listCaretakers() {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM caretakers ORDER BY created_at DESC;');
        return res.rows.map((row) => this._mapCaretakerRow(row));
      } catch (err) {
        console.error('[DB:listCaretakers] Postgres error:', err.message);
      }
    }
    return Array.from(this.state.caretakers.values());
  }

  async isCaretakerSuspended(caretakerId) {
    if (!caretakerId) return false;
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT is_suspended FROM caretakers WHERE id = $1;', [caretakerId]);
        if (res.rows.length > 0) return Boolean(res.rows[0].is_suspended);
      } catch (err) {
        console.error('[DB:isCaretakerSuspended] Postgres error:', err.message);
      }
    }
    const ct = this.state.caretakers.get(caretakerId);
    return Boolean(ct && ct.isSuspended);
  }

  async getCaretakerProfileData(id) {
    if (!id) return null;

    let caretaker = await this.findCaretakerById(id);
    const user = await this.findUserById(id);

    if (!caretaker && !user) {
      return null;
    }

    if (!caretaker && user) {
      caretaker = await this.createCaretaker({
        id: user.id,
        name: user.name || 'Caretaker',
        phone: user.phone || '',
        isVerified: false,
        isSuspended: Boolean(user.isSuspended),
        joinedAt: user.createdAt || new Date().toISOString()
      });
    }

    const isVerified = Boolean(caretaker.isVerified || caretaker.verified);
    const formattedCaretaker = {
      id: caretaker.id,
      name: caretaker.name || user?.name || 'Caretaker',
      phone: caretaker.phone || user?.phone || '',
      email: user?.email || '',
      isVerified,
      verified: isVerified,
      isSuspended: Boolean(caretaker.isSuspended || user?.isSuspended),
      joinedAt: caretaker.joinedAt || user?.createdAt || new Date().toISOString()
    };

    const rooms = await this.queryRooms({ caretakerId: caretaker.id, includeHidden: true });
    const roomIds = rooms.map((r) => r.id);
    const reportCount = await this.countReportsByRooms(roomIds);

    const trust = computeTrust({
      verified: isVerified,
      rooms,
      reportCount,
      joinedAt: formattedCaretaker.joinedAt
    });

    formattedCaretaker.trustScore = trust.score;

    const verReq = await this.getVerificationRequest(caretaker.id);
    let verification;
    if (verReq) {
      verification = {
        status: verReq.status,
        request: {
          id: verReq.id,
          userId: verReq.userId,
          kind: verReq.kind,
          documentUrl: verReq.documentUrl,
          documentName: verReq.documentName,
          status: verReq.status,
          reviewNote: verReq.reviewNote,
          reason: verReq.reviewNote || verReq.reason,
          submittedAt: verReq.submittedAt,
          reviewedAt: verReq.reviewedAt,
          reviewedBy: verReq.reviewedBy
        }
      };
    } else if (isVerified) {
      verification = {
        status: 'approved',
        request: null
      };
    } else {
      verification = {
        status: 'none',
        request: null
      };
    }

    return {
      caretaker: formattedCaretaker,
      rooms,
      trust,
      verification
    };
  }

  // --- Rooms ---
  async findRoomById(id) {
    if (!id) return null;
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM rooms WHERE id = $1;', [id]);
        if (res.rows.length > 0) return this._mapRoomRow(res.rows[0]);
      } catch (err) {
        console.error('[DB:findRoomById] Postgres error:', err.message);
      }
    }
    return this.state.rooms.get(id) || null;
  }

  async createRoom(roomData) {
    const id = roomData.id || `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const room = {
      id,
      title: roomData.title,
      description: roomData.description || '',
      roomType: roomData.roomType,
      rentKes: Number(roomData.rentKes),
      depositTerms: roomData.depositTerms || 'No deposit',
      area: roomData.area,
      distances: roomData.distances || {},
      matatuFareKes: Number(roomData.matatuFareKes || 0),
      amenities: Array.isArray(roomData.amenities) ? roomData.amenities : [],
      photos: Array.isArray(roomData.photos) ? roomData.photos : [],
      mapLink: roomData.mapLink || null,
      status: roomData.status || 'Vacant',
      lastConfirmedVacantAt: roomData.lastConfirmedVacantAt || new Date().toISOString(),
      whatsappNumber: roomData.whatsappNumber,
      callNumber: roomData.callNumber,
      caretakerId: roomData.caretakerId,
      buildingId: roomData.buildingId || null,
      hidden: Boolean(roomData.hidden),
      gender: roomData.gender || null,
      meals: Boolean(roomData.meals),
      transport: Boolean(roomData.transport),
      distanceKm: roomData.distanceKm ? Number(roomData.distanceKm) : null,
      registrationFee: roomData.registrationFee ? Number(roomData.registrationFee) : 0,
      inGuide: Boolean(roomData.inGuide),
      roomOptions: roomData.roomOptions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.usePostgres) {
      try {
        await this.pool.query(
          `INSERT INTO rooms (
            id, title, description, room_type, rent_kes, deposit_terms, area,
            distances, matatu_fare_kes, amenities, photos, map_link, status,
            last_confirmed_vacant_at, whatsapp_number, call_number, caretaker_id,
            building_id, hidden, gender, meals, transport, distance_km, registration_fee, in_guide,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, $25,
            $26, $27
          ) ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            rent_kes = EXCLUDED.rent_kes,
            photos = EXCLUDED.photos,
            status = EXCLUDED.status,
            last_confirmed_vacant_at = EXCLUDED.last_confirmed_vacant_at,
            updated_at = NOW();`,
          [
            room.id, room.title, room.description, room.roomType, room.rentKes, room.depositTerms, room.area,
            JSON.stringify(room.distances), room.matatuFareKes, room.amenities, room.photos, room.mapLink, room.status,
            room.lastConfirmedVacantAt, room.whatsappNumber, room.callNumber, room.caretakerId,
            room.buildingId, room.hidden, room.gender, room.meals, room.transport, room.distanceKm, room.registrationFee, room.inGuide,
            room.createdAt, room.updatedAt
          ]
        );
      } catch (err) {
        console.error('[DB:createRoom] Postgres error:', err.message);
      }
    }

    this.state.rooms.set(id, room);
    return room;
  }

  async updateRoom(id, updates) {
    if (this.usePostgres) {
      try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (updates.title !== undefined) { fields.push(`title = $${idx++}`); values.push(updates.title); }
        if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
        if (updates.rentKes !== undefined) { fields.push(`rent_kes = $${idx++}`); values.push(Number(updates.rentKes)); }
        if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
        if (updates.hidden !== undefined) { fields.push(`hidden = $${idx++}`); values.push(Boolean(updates.hidden)); }
        if (updates.photos !== undefined) { fields.push(`photos = $${idx++}`); values.push(updates.photos); }
        if (updates.lastConfirmedVacantAt !== undefined) { fields.push(`last_confirmed_vacant_at = $${idx++}`); values.push(updates.lastConfirmedVacantAt); }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const res = await this.pool.query(`UPDATE rooms SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`, values);
        if (res.rows.length > 0) {
          const updated = this._mapRoomRow(res.rows[0]);
          this.state.rooms.set(id, updated);
          return updated;
        }
      } catch (err) {
        console.error('[DB:updateRoom] Postgres error:', err.message);
      }
    }

    const room = this.state.rooms.get(id);
    if (!room) return null;
    const updated = {
      ...room,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.state.rooms.set(id, updated);
    return updated;
  }

  async deleteRoom(id) {
    if (this.usePostgres) {
      try {
        await this.pool.query('DELETE FROM rooms WHERE id = $1;', [id]);
      } catch (err) {
        console.error('[DB:deleteRoom] Postgres error:', err.message);
      }
    }
    return this.state.rooms.delete(id);
  }

  async queryRooms(filters = {}) {
    if (this.usePostgres) {
      try {
        let sql = `
          SELECT r.* 
          FROM rooms r
          LEFT JOIN caretakers c ON r.caretaker_id = c.id
          WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (!filters.includeHidden) {
          sql += ` AND r.hidden = false AND (c.is_suspended = false OR c.is_suspended IS NULL)`;
        }
        if (filters.area) {
          sql += ` AND LOWER(r.area) = LOWER($${idx++})`;
          values.push(filters.area);
        }
        if (filters.roomType) {
          sql += ` AND r.room_type = $${idx++}`;
          values.push(filters.roomType);
        }
        if (filters.minRent) {
          sql += ` AND r.rent_kes >= $${idx++}`;
          values.push(Number(filters.minRent));
        }
        if (filters.maxRent) {
          sql += ` AND r.rent_kes <= $${idx++}`;
          values.push(Number(filters.maxRent));
        }
        if (filters.gender) {
          sql += ` AND (r.gender IS NULL OR r.gender = $${idx++} OR r.gender = 'Mixed')`;
          values.push(filters.gender);
        }
        if (filters.mealsOnly) {
          sql += ` AND r.meals = true`;
        }
        if (filters.transportOnly) {
          sql += ` AND r.transport = true`;
        }
        if (filters.vacantOnly) {
          sql += ` AND r.status = 'Vacant'`;
        }
        if (filters.caretakerId) {
          sql += ` AND r.caretaker_id = $${idx++}`;
          values.push(filters.caretakerId);
        }

        if (filters.sort === 'rent_asc') {
          sql += ` ORDER BY r.rent_kes ASC`;
        } else if (filters.sort === 'rent_desc') {
          sql += ` ORDER BY r.rent_kes DESC`;
        } else {
          sql += ` ORDER BY (CASE WHEN r.status = 'Vacant' THEN 0 ELSE 1 END), r.last_confirmed_vacant_at DESC`;
        }

        const res = await this.pool.query(sql, values);
        return res.rows.map((row) => this._mapRoomRow(row));
      } catch (err) {
        console.error('[DB:queryRooms] Postgres error:', err.message);
      }
    }

    let result = Array.from(this.state.rooms.values());

    if (!filters.includeHidden) {
      result = result.filter((r) => !r.hidden && !this.state.caretakers.get(r.caretakerId)?.isSuspended);
    }

    if (filters.area) {
      result = result.filter((r) => r.area.toLowerCase() === filters.area.toLowerCase());
    }

    if (filters.roomType) {
      result = result.filter((r) => r.roomType === filters.roomType);
    }

    if (filters.minRent) {
      result = result.filter((r) => r.rentKes >= Number(filters.minRent));
    }

    if (filters.maxRent) {
      result = result.filter((r) => r.rentKes <= Number(filters.maxRent));
    }

    if (filters.gender) {
      result = result.filter((r) => !r.gender || r.gender === filters.gender || r.gender === 'Mixed');
    }

    if (filters.mealsOnly) {
      result = result.filter((r) => r.meals);
    }

    if (filters.transportOnly) {
      result = result.filter((r) => r.transport);
    }

    if (filters.vacantOnly) {
      result = result.filter((r) => r.status === 'Vacant');
    }

    if (filters.caretakerId) {
      result = result.filter((r) => r.caretakerId === filters.caretakerId);
    }

    if (filters.amenities && Array.isArray(filters.amenities) && filters.amenities.length > 0) {
      result = result.filter((r) => filters.amenities.every((a) => r.amenities.includes(a)));
    }

    if (filters.near) {
      const campus = filters.near.toLowerCase();
      result = result.filter((r) => {
        const d = r.distances?.[campus] || r.distances?.[campus.toUpperCase()];
        if (d && (d.walkMin <= 20 || d.matatuMin <= 20)) return true;
        if (r.inGuide) return true;
        return false;
      });
    }

    // Sort order
    if (filters.sort === 'rent_asc') {
      result.sort((a, b) => a.rentKes - b.rentKes);
    } else if (filters.sort === 'rent_desc') {
      result.sort((a, b) => b.rentKes - a.rentKes);
    } else {
      result.sort((a, b) => {
        if (a.status === 'Vacant' && b.status !== 'Vacant') return -1;
        if (a.status !== 'Vacant' && b.status === 'Vacant') return 1;
        return new Date(b.lastConfirmedVacantAt).getTime() - new Date(a.lastConfirmedVacantAt).getTime();
      });
    }

    return result;
  }

  async findRoomsByBuilding(buildingId, excludeRoomId) {
    if (!buildingId) return [];
    if (this.usePostgres) {
      try {
        const res = await this.pool.query(
          'SELECT * FROM rooms WHERE building_id = $1 AND id != $2 AND hidden = false;',
          [buildingId, excludeRoomId]
        );
        return res.rows.map((row) => this._mapRoomRow(row));
      } catch (err) {
        console.error('[DB:findRoomsByBuilding] Postgres error:', err.message);
      }
    }
    return Array.from(this.state.rooms.values()).filter(
      (r) => r.buildingId === buildingId && r.id !== excludeRoomId && !r.hidden
    );
  }

  // --- Saved Rooms ---
  async getSavedRoomIds(userId) {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT room_id FROM saved_rooms WHERE user_id = $1 ORDER BY created_at DESC;', [userId]);
        return res.rows.map((r) => r.room_id);
      } catch (err) {
        console.error('[DB:getSavedRoomIds] Postgres error:', err.message);
      }
    }
    return Array.from(this.state.savedRooms.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .map((s) => s.roomId);
  }

  async saveRoom(userId, roomId) {
    if (this.usePostgres) {
      await this._ensureUserInPostgres(userId);
      try {
        await this.pool.query(
          'INSERT INTO saved_rooms (user_id, room_id) VALUES ($1, $2) ON CONFLICT (user_id, room_id) DO NOTHING;',
          [userId, roomId]
        );
      } catch (err) {
        console.error('[DB:saveRoom] Postgres error:', err.message);
        throw err;
      }
    }
    const key = `${userId}:${roomId}`;
    if (!this.state.savedRooms.has(key)) {
      this.state.savedRooms.set(key, { userId, roomId, savedAt: new Date().toISOString() });
    }
    return true;
  }

  async unsaveRoom(userId, roomId) {
    if (this.usePostgres) {
      try {
        await this.pool.query('DELETE FROM saved_rooms WHERE user_id = $1 AND room_id = $2;', [userId, roomId]);
      } catch (err) {
        console.error('[DB:unsaveRoom] Postgres error:', err.message);
        throw err;
      }
    }
    const key = `${userId}:${roomId}`;
    return this.state.savedRooms.delete(key);
  }

  // --- Vacancy Alerts ---
  async getAlerts(userId) {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM vacancy_alerts WHERE user_id = $1;', [userId]);
        return res.rows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          area: r.area,
          roomType: r.room_type,
          maxRentKes: r.max_rent_kes,
          active: r.active,
          createdAt: r.created_at
        }));
      } catch (err) {
        console.error('[DB:getAlerts] Postgres error:', err.message);
      }
    }
    return Array.from(this.state.vacancyAlerts.values()).filter((a) => a.userId === userId);
  }

  async findAlertById(id) {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM vacancy_alerts WHERE id = $1;', [id]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            userId: r.user_id,
            area: r.area,
            roomType: r.room_type,
            maxRentKes: r.max_rent_kes,
            active: r.active,
            createdAt: r.created_at
          };
        }
      } catch (err) {
        console.error('[DB:findAlertById] Postgres error:', err.message);
      }
    }
    return this.state.vacancyAlerts.get(id) || null;
  }

  async createAlert(alertData) {
    const id = `alt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const alert = {
      id,
      userId: alertData.userId,
      area: alertData.area || null,
      roomType: alertData.roomType || null,
      maxRentKes: alertData.maxRentKes ? Number(alertData.maxRentKes) : null,
      active: alertData.active !== undefined ? Boolean(alertData.active) : true,
      createdAt: new Date().toISOString()
    };

    if (this.usePostgres) {
      await this._ensureUserInPostgres(alert.userId);
      try {
        await this.pool.query(
          `INSERT INTO vacancy_alerts (id, user_id, area, room_type, max_rent_kes, active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [alert.id, alert.userId, alert.area, alert.roomType, alert.maxRentKes, alert.active, alert.createdAt]
        );
      } catch (err) {
        console.error('[DB:createAlert] Postgres error:', err.message);
      }
    }

    this.state.vacancyAlerts.set(id, alert);
    return alert;
  }

  async updateAlert(id, updates) {
    if (this.usePostgres) {
      try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (updates.active !== undefined) { fields.push(`active = $${idx++}`); values.push(Boolean(updates.active)); }
        if (updates.area !== undefined) { fields.push(`area = $${idx++}`); values.push(updates.area); }
        if (updates.roomType !== undefined) { fields.push(`room_type = $${idx++}`); values.push(updates.roomType); }
        if (updates.maxRentKes !== undefined) { fields.push(`max_rent_kes = $${idx++}`); values.push(Number(updates.maxRentKes)); }
        values.push(id);
        await this.pool.query(`UPDATE vacancy_alerts SET ${fields.join(', ')} WHERE id = $${idx};`, values);
      } catch (err) {
        console.error('[DB:updateAlert] Postgres error:', err.message);
      }
    }
    const alert = this.state.vacancyAlerts.get(id);
    if (!alert) return null;
    const updated = { ...alert, ...updates };
    this.state.vacancyAlerts.set(id, updated);
    return updated;
  }

  async deleteAlert(id) {
    if (this.usePostgres) {
      try {
        await this.pool.query('DELETE FROM vacancy_alerts WHERE id = $1;', [id]);
      } catch (err) {
        console.error('[DB:deleteAlert] Postgres error:', err.message);
      }
    }
    return this.state.vacancyAlerts.delete(id);
  }

  async findMatchingAlerts(room) {
    const activeAlerts = Array.from(this.state.vacancyAlerts.values()).filter((a) => a.active);
    return activeAlerts.filter((a) => {
      if (a.area && a.area.toLowerCase() !== room.area.toLowerCase()) return false;
      if (a.roomType && a.roomType !== room.roomType) return false;
      if (a.maxRentKes && room.rentKes > a.maxRentKes) return false;
      return true;
    });
  }

  // --- Reports ---
  async createReport(reportData) {
    const id = `rep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const report = {
      id,
      roomId: reportData.roomId,
      userId: reportData.userId || null,
      reason: reportData.reason,
      note: reportData.note || '',
      status: 'open',
      action: null,
      handledAt: null,
      handledBy: null,
      createdAt: new Date().toISOString()
    };
    if (this.usePostgres) {
      try {
        await this.pool.query(
          `INSERT INTO listing_reports (id, room_id, user_id, reason, note, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [report.id, report.roomId, report.userId, report.reason, report.note, report.status, report.createdAt]
        );
      } catch (err) {
        console.error('[DB:createReport] Postgres error:', err.message);
      }
    }
    this.state.reports.set(id, report);
    return report;
  }

  async listReports(statusFilter) {
    if (this.usePostgres) {
      try {
        const sql = statusFilter
          ? 'SELECT * FROM listing_reports WHERE status = $1 ORDER BY created_at DESC;'
          : 'SELECT * FROM listing_reports ORDER BY created_at DESC;';
        const params = statusFilter ? [statusFilter] : [];
        const res = await this.pool.query(sql, params);
        return res.rows.map((r) => ({
          id: r.id,
          roomId: r.room_id,
          userId: r.user_id,
          reason: r.reason,
          note: r.note,
          status: r.status,
          action: r.action,
          handledAt: r.handled_at,
          handledBy: r.handled_by,
          createdAt: r.created_at
        }));
      } catch (err) {
        console.error('[DB:listReports] Postgres error:', err.message);
      }
    }
    const all = Array.from(this.state.reports.values());
    if (statusFilter) {
      return all.filter((r) => r.status === statusFilter);
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findReportById(id) {
    if (!id) return null;
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM listing_reports WHERE id = $1;', [id]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            roomId: r.room_id,
            userId: r.user_id,
            reason: r.reason,
            note: r.note,
            status: r.status,
            action: r.action,
            handledAt: r.handled_at,
            handledBy: r.handled_by,
            createdAt: r.created_at
          };
        }
      } catch (err) {
        console.error('[DB:findReportById] Postgres error:', err.message);
      }
    }
    return this.state.reports.get(id) || null;
  }

  async updateReport(id, updates) {
    if (this.usePostgres) {
      try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
        if (updates.action !== undefined) { fields.push(`action = $${idx++}`); values.push(updates.action); }
        if (updates.handledBy !== undefined) { fields.push(`handled_by = $${idx++}`); values.push(updates.handledBy); }
        fields.push(`handled_at = NOW()`);
        values.push(id);
        await this.pool.query(`UPDATE listing_reports SET ${fields.join(', ')} WHERE id = $${idx};`, values);
      } catch (err) {
        console.error('[DB:updateReport] Postgres error:', err.message);
      }
    }
    const report = this.state.reports.get(id);
    if (!report) return null;
    const updated = { ...report, ...updates };
    this.state.reports.set(id, updated);
    return updated;
  }

  async countOpenReportsForRoom(roomId) {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query("SELECT COUNT(*) FROM listing_reports WHERE room_id = $1 AND status = 'open';", [roomId]);
        return parseInt(res.rows[0].count, 10);
      } catch (err) {
        console.error('[DB:countOpenReportsForRoom] Postgres error:', err.message);
      }
    }
    let count = 0;
    for (const r of this.state.reports.values()) {
      if (r.roomId === roomId && r.status === 'open') count++;
    }
    return count;
  }

  async countReportsByRooms(roomIds) {
    if (!roomIds || roomIds.length === 0) return 0;
    if (this.usePostgres) {
      try {
        const res = await this.pool.query(
          "SELECT COUNT(*) FROM listing_reports WHERE room_id = ANY($1::varchar[]);",
          [roomIds]
        );
        return parseInt(res.rows[0].count, 10);
      } catch (err) {
        console.error('[DB:countReportsByRooms] Postgres error:', err.message);
      }
    }
    let count = 0;
    const roomSet = new Set(roomIds);
    for (const r of this.state.reports.values()) {
      if (roomSet.has(r.roomId)) count++;
    }
    return count;
  }

  // --- Caretaker KYC Verification Requests ---
  async getVerificationRequest(userId) {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query(
          "SELECT * FROM verification_requests WHERE user_id = $1 AND kind = 'caretaker' ORDER BY submitted_at DESC LIMIT 1;",
          [userId]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            userId: r.user_id,
            kind: r.kind,
            documentUrl: r.document_url,
            documentName: r.document_name,
            status: r.status,
            reviewNote: r.review_note,
            reviewedAt: r.reviewed_at,
            reviewedBy: r.reviewed_by,
            submittedAt: r.submitted_at
          };
        }
        return null;
      } catch (err) {
        console.error('[DB:getVerificationRequest] Postgres error:', err.message);
      }
    }
    let latest = null;
    for (const req of this.state.verificationRequests.values()) {
      if (req.userId === userId && req.kind === 'caretaker') {
        if (!latest || new Date(req.submittedAt).getTime() > new Date(latest.submittedAt).getTime()) {
          latest = req;
        }
      }
    }
    return latest;
  }

  async findVerificationRequestById(id) {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM verification_requests WHERE id = $1;', [id]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            userId: r.user_id,
            kind: r.kind,
            documentUrl: r.document_url,
            documentName: r.document_name,
            status: r.status,
            reviewNote: r.review_note,
            reviewedAt: r.reviewed_at,
            reviewedBy: r.reviewed_by,
            submittedAt: r.submitted_at
          };
        }
      } catch (err) {
        console.error('[DB:findVerificationRequestById] Postgres error:', err.message);
      }
    }
    return this.state.verificationRequests.get(id) || null;
  }

  async createVerificationRequest(reqData) {
    const id = `ver-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const request = {
      id,
      userId: reqData.userId,
      kind: 'caretaker',
      documentUrl: reqData.documentUrl,
      documentName: reqData.documentName || 'National ID / Passport',
      status: 'pending',
      reviewNote: null,
      reviewedAt: null,
      reviewedBy: null,
      submittedAt: new Date().toISOString()
    };
    if (this.usePostgres) {
      await this._ensureUserInPostgres(request.userId);
      try {
        await this.pool.query(
          `INSERT INTO verification_requests (id, user_id, kind, document_url, document_name, status, submitted_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [request.id, request.userId, request.kind, request.documentUrl, request.documentName, request.status, request.submittedAt]
        );
      } catch (err) {
        console.error('[DB:createVerificationRequest] Postgres error:', err.message);
      }
    }
    this.state.verificationRequests.set(id, request);
    return request;
  }

  async listVerificationQueue() {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query("SELECT * FROM verification_requests WHERE status = 'pending' ORDER BY submitted_at ASC;");
        return res.rows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          kind: r.kind,
          documentUrl: r.document_url,
          documentName: r.document_name,
          status: r.status,
          submittedAt: r.submitted_at
        }));
      } catch (err) {
        console.error('[DB:listVerificationQueue] Postgres error:', err.message);
      }
    }
    return Array.from(this.state.verificationRequests.values())
      .filter((r) => r.status === 'pending')
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  }

  async listVerificationHistory() {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query("SELECT * FROM verification_requests WHERE status != 'pending' ORDER BY reviewed_at DESC;");
        return res.rows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          kind: r.kind,
          documentUrl: r.document_url,
          documentName: r.document_name,
          status: r.status,
          reviewNote: r.review_note,
          reviewedAt: r.reviewed_at,
          reviewedBy: r.reviewed_by,
          submittedAt: r.submitted_at
        }));
      } catch (err) {
        console.error('[DB:listVerificationHistory] Postgres error:', err.message);
      }
    }
    return Array.from(this.state.verificationRequests.values())
      .filter((r) => r.status !== 'pending')
      .sort((a, b) => new Date(b.reviewedAt || b.submittedAt).getTime() - new Date(a.reviewedAt || a.submittedAt).getTime());
  }

  async updateVerificationRequest(id, updates) {
    if (this.usePostgres) {
      try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
        if (updates.reviewNote !== undefined) { fields.push(`review_note = $${idx++}`); values.push(updates.reviewNote); }
        if (updates.reviewedBy !== undefined) { fields.push(`reviewed_by = $${idx++}`); values.push(updates.reviewedBy); }
        fields.push(`reviewed_at = NOW()`);
        values.push(id);
        await this.pool.query(`UPDATE verification_requests SET ${fields.join(', ')} WHERE id = $${idx};`, values);
      } catch (err) {
        console.error('[DB:updateVerificationRequest] Postgres error:', err.message);
      }
    }
    const req = this.state.verificationRequests.get(id);
    if (!req) return null;
    const updated = { ...req, ...updates };
    this.state.verificationRequests.set(id, updated);
    return updated;
  }

  // --- Activity Audit Entries ---
  async createActivityEntry(entryData) {
    const entry = {
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      actorId: entryData.actorId || null,
      actorName: entryData.actorName || 'System',
      action: entryData.action,
      category: entryData.category || 'general',
      targetType: entryData.targetType,
      targetId: entryData.targetId,
      details: entryData.details || {},
      createdAt: new Date().toISOString()
    };
    if (this.usePostgres) {
      try {
        await this.pool.query(
          `INSERT INTO activity_entries (id, actor_id, actor_name, action, category, target_type, target_id, details, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
          [entry.id, entry.actorId, entry.actorName, entry.action, entry.category, entry.targetType, entry.targetId, JSON.stringify(entry.details), entry.createdAt]
        );
      } catch (err) {
        console.error('[DB:createActivityEntry] Postgres error:', err.message);
      }
    }
    this.state.activityEntries.unshift(entry);
    if (this.state.activityEntries.length > 500) {
      this.state.activityEntries.pop();
    }
    return entry;
  }

  async listActivityEntries(categoryFilter) {
    if (this.usePostgres) {
      try {
        const sql = categoryFilter
          ? 'SELECT * FROM activity_entries WHERE category = $1 ORDER BY created_at DESC LIMIT 100;'
          : 'SELECT * FROM activity_entries ORDER BY created_at DESC LIMIT 100;';
        const params = categoryFilter ? [categoryFilter] : [];
        const res = await this.pool.query(sql, params);
        return res.rows.map((r) => ({
          id: r.id,
          actorId: r.actor_id,
          actorName: r.actor_name,
          action: r.action,
          category: r.category,
          targetType: r.target_type,
          targetId: r.target_id,
          details: typeof r.details === 'string' ? JSON.parse(r.details) : (r.details || {}),
          createdAt: r.created_at
        }));
      } catch (err) {
        console.error('[DB:listActivityEntries] Postgres error:', err.message);
      }
    }
    if (categoryFilter) {
      return this.state.activityEntries.filter((a) => a.category === categoryFilter);
    }
    return this.state.activityEntries;
  }

  // --- Contact Events Telemetry ---
  async recordContactEvent(eventData) {
    const event = {
      id: `cnt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      roomId: eventData.roomId,
      userId: eventData.userId || null,
      channel: eventData.channel,
      createdAt: new Date().toISOString()
    };
    if (this.usePostgres) {
      try {
        await this.pool.query(
          `INSERT INTO contact_events (id, room_id, user_id, channel, created_at)
           VALUES ($1, $2, $3, $4, $5);`,
          [event.id, event.roomId, event.userId, event.channel, event.createdAt]
        );
      } catch (err) {
        console.error('[DB:recordContactEvent] Postgres error:', err.message);
      }
    }
    this.state.contactEvents.unshift(event);
    if (this.state.contactEvents.length > 2000) {
      this.state.contactEvents.pop();
    }
    return event;
  }

  async isContactDeduplicated(roomId, channel, windowMs = 30000) {
    const now = Date.now();
    return this.state.contactEvents.some(
      (e) => e.roomId === roomId && e.channel === channel && now - new Date(e.createdAt).getTime() < windowMs
    );
  }

  async countContactEventsForRoom(roomId) {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT COUNT(*) FROM contact_events WHERE room_id = $1;', [roomId]);
        return parseInt(res.rows[0].count, 10);
      } catch (err) {
        console.error('[DB:countContactEventsForRoom] Postgres error:', err.message);
      }
    }
    return this.state.contactEvents.filter((e) => e.roomId === roomId).length;
  }

  // --- Site Settings ---
  async getSiteSettings() {
    if (this.usePostgres) {
      try {
        const res = await this.pool.query('SELECT * FROM site_settings WHERE id = 1;');
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            whatsapp: r.whatsapp,
            phone: r.phone,
            email: r.email,
            hours: r.hours,
            location: r.location,
            updatedAt: r.updated_at
          };
        }
      } catch (err) {
        console.error('[DB:getSiteSettings] Postgres error:', err.message);
      }
    }
    return { ...this.state.siteSettings };
  }

  async updateSiteSettings(updates) {
    if (this.usePostgres) {
      try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (updates.whatsapp !== undefined) { fields.push(`whatsapp = $${idx++}`); values.push(updates.whatsapp); }
        if (updates.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(updates.phone); }
        if (updates.email !== undefined) { fields.push(`email = $${idx++}`); values.push(updates.email); }
        if (updates.hours !== undefined) { fields.push(`hours = $${idx++}`); values.push(updates.hours); }
        if (updates.location !== undefined) { fields.push(`location = $${idx++}`); values.push(updates.location); }
        fields.push(`updated_at = NOW()`);
        await this.pool.query(`UPDATE site_settings SET ${fields.join(', ')} WHERE id = 1;`, values);
      } catch (err) {
        console.error('[DB:updateSiteSettings] Postgres error:', err.message);
      }
    }
    this.state.siteSettings = {
      ...this.state.siteSettings,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return { ...this.state.siteSettings };
  }

  // --- Email OTPs & Rate Limiting ---
  async recordEmailOtp(email, code, ipAddress) {
    const normalized = email.trim().toLowerCase();
    const id = `otp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min TTL
    const resendAvailableAt = new Date(Date.now() + 60 * 1000); // 60s cooldown
    const createdAt = new Date();
    const codeHash = bcrypt.hashSync(code, 10);

    if (this.usePostgres) {
      try {
        await this.pool.query(
          `INSERT INTO email_otps (id, email, code, code_hash, expires_at, resend_available_at, attempts, ip_address, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
          [id, normalized, code, codeHash, expiresAt, resendAvailableAt, 0, ipAddress, createdAt]
        );
      } catch (err) {
        console.error('[DB:recordEmailOtp] Postgres error:', err.message);
      }
    }

    const attempts = this.state.emailOtps.get(normalized) || [];
    const record = {
      id,
      email: normalized,
      code,
      codeHash,
      ipAddress,
      expiresAt: expiresAt.getTime(),
      resendAvailableAt: resendAvailableAt.getTime(),
      createdAt: createdAt.getTime()
    };
    attempts.unshift(record);
    this.state.emailOtps.set(normalized, attempts);
    return record;
  }

  async getLatestEmailOtp(email) {
    const normalized = email.trim().toLowerCase();
    if (this.usePostgres) {
      try {
        const res = await this.pool.query(
          'SELECT * FROM email_otps WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC LIMIT 1;',
          [normalized]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            email: r.email,
            code: r.code,
            codeHash: r.code_hash,
            ipAddress: r.ip_address,
            attempts: Number(r.attempts || 0),
            expiresAt: new Date(r.expires_at).getTime(),
            resendAvailableAt: new Date(r.resend_available_at).getTime(),
            createdAt: new Date(r.created_at).getTime()
          };
        }
      } catch (err) {
        console.error('[DB:getLatestEmailOtp] Postgres error:', err.message);
      }
    }
    const attempts = this.state.emailOtps.get(normalized) || [];
    return attempts[0] || null;
  }

  async checkOtpRateLimits(email, ipAddress) {
    const normalized = email.trim().toLowerCase();
    if (this.usePostgres) {
      try {
        // 1. Check per-email rate limit (max 5 per hour)
        const emailCountRes = await this.pool.query(
          "SELECT COUNT(*) FROM email_otps WHERE LOWER(email) = LOWER($1) AND created_at > NOW() - INTERVAL '1 hour';",
          [normalized]
        );
        const emailCount = parseInt(emailCountRes.rows[0].count, 10);
        if (emailCount >= 5) {
          return { allowed: false, reason: 'Too many verification codes requested for this email. Please wait an hour.' };
        }

        // 2. Check 60-second cooldown on latest request
        const latestRes = await this.pool.query(
          'SELECT resend_available_at FROM email_otps WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC LIMIT 1;',
          [normalized]
        );
        if (latestRes.rows.length > 0) {
          const resendAt = new Date(latestRes.rows[0].resend_available_at).getTime();
          if (Date.now() < resendAt) {
            const waitSec = Math.ceil((resendAt - Date.now()) / 1000);
            return { allowed: false, reason: `Please wait ${waitSec} seconds before requesting another code.` };
          }
        }

        // 3. Check per-IP rate limit (max 20 per hour)
        const ipCountRes = await this.pool.query(
          "SELECT COUNT(*) FROM email_otps WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '1 hour';",
          [ipAddress]
        );
        const ipCount = parseInt(ipCountRes.rows[0].count, 10);
        if (ipCount >= 20) {
          return { allowed: false, reason: 'Too many requests from this IP address. Please try again later.' };
        }

        return { allowed: true };
      } catch (err) {
        console.error('[DB:checkOtpRateLimits] Postgres error:', err.message);
      }
    }

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Check per-email rate limit (max 5 per hour)
    const emailAttempts = (this.state.emailOtps.get(normalized) || []).filter((a) => a.createdAt > oneHourAgo);
    if (emailAttempts.length >= 5) {
      return { allowed: false, reason: 'Too many verification codes requested for this email. Please wait an hour.' };
    }

    // Check 60-second cooldown on latest request
    const latest = emailAttempts[0];
    if (latest && Date.now() < latest.resendAvailableAt) {
      const waitSec = Math.ceil((latest.resendAvailableAt - Date.now()) / 1000);
      return { allowed: false, reason: `Please wait ${waitSec} seconds before requesting another code.` };
    }

    // Check per-IP rate limit (max 20 per hour)
    let ipCount = 0;
    for (const attempts of this.state.emailOtps.values()) {
      for (const a of attempts) {
        if (a.ipAddress === ipAddress && a.createdAt > oneHourAgo) {
          ipCount++;
        }
      }
    }
    if (ipCount >= 20) {
      return { allowed: false, reason: 'Too many requests from this IP address. Please try again later.' };
    }

    return { allowed: true };
  }
}

export const db = new Database();

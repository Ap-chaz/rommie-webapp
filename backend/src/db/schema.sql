-- Rommie PostgreSQL Schema Definition
-- Governed by docs/DATABASE_DESIGN.md (Version 1.1)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    school VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'caretaker', 'admin')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_google BOOLEAN NOT NULL DEFAULT FALSE,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Caretakers Profile Table
CREATE TABLE IF NOT EXISTS caretakers (
    id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Rooms / Listings Table
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('bedsitter', 'single_room', 'one_bedroom', 'hostel')),
    rent_kes INTEGER NOT NULL CHECK (rent_kes > 0),
    deposit_terms VARCHAR(150) NOT NULL,
    area VARCHAR(50) NOT NULL CHECK (area IN ('Gataka', 'Rongai', 'Maasai Lodge', 'Karen')),
    distances JSONB NOT NULL DEFAULT '{}'::jsonb,
    matatu_fare_kes INTEGER NOT NULL DEFAULT 0,
    amenities TEXT[] NOT NULL DEFAULT '{}',
    photos TEXT[] NOT NULL,
    map_link TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'Vacant' CHECK (status IN ('Vacant', 'Taken')),
    last_confirmed_vacant_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    whatsapp_number VARCHAR(20) NOT NULL,
    call_number VARCHAR(20) NOT NULL,
    caretaker_id VARCHAR(64) NOT NULL REFERENCES caretakers(id) ON DELETE CASCADE,
    building_id VARCHAR(50),
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    -- Hostel-specific nullable fields
    gender VARCHAR(10) CHECK (gender IN ('Ladies', 'Gents', 'Mixed')),
    meals BOOLEAN DEFAULT FALSE,
    transport BOOLEAN DEFAULT FALSE,
    distance_km NUMERIC(4, 1),
    registration_fee INTEGER DEFAULT 0,
    in_guide BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_photos_count CHECK (cardinality(photos) = 10)
);

-- 4. Room Options Table (Hostels)
CREATE TABLE IF NOT EXISTS room_options (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL,
    rent INTEGER NOT NULL CHECK (rent > 0),
    max_rent INTEGER,
    billing VARCHAR(10) NOT NULL CHECK (billing IN ('month', 'semester')),
    photos TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Saved Rooms Table
CREATE TABLE IF NOT EXISTS saved_rooms (
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, room_id)
);

-- 6. Vacancy Alerts Table
CREATE TABLE IF NOT EXISTS vacancy_alerts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area VARCHAR(50),
    room_type VARCHAR(20),
    max_rent_kes INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Listing Reports Table
CREATE TABLE IF NOT EXISTS listing_reports (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(50) NOT NULL,
    note VARCHAR(300),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    action VARCHAR(50),
    handled_at TIMESTAMPTZ,
    handled_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Verification Requests Table (Caretaker KYC only)
CREATE TABLE IF NOT EXISTS verification_requests (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL DEFAULT 'caretaker' CHECK (kind IN ('caretaker')),
    document_url TEXT NOT NULL,
    document_name VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    review_note TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(100),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Activity Entries Table (Admin Audit Trail)
CREATE TABLE IF NOT EXISTS activity_entries (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Contact Events Table (Telemetry)
CREATE TABLE IF NOT EXISTS contact_events (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('whatsapp', 'call')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Site Settings Table (Singleton)
CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    whatsapp VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hours VARCHAR(80) NOT NULL,
    location VARCHAR(80) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Email OTPs Table
CREATE TABLE IF NOT EXISTS email_otps (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(20),
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    resend_available_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

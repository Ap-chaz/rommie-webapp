import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
import { config } from '../config.js';

dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 10 standard photos generator helper pointing to Cloudflare R2 / CDN
export const generate10Photos = (slug) => {
  const base = (config.r2PublicUrl || 'https://cdn.rommie.co.ke').replace(/\/+$/, '');
  return [
    `${base}/rooms/${slug}/01-main-room.webp`,
    `${base}/rooms/${slug}/02-opposite-angle.webp`,
    `${base}/rooms/${slug}/03-bed-living.webp`,
    `${base}/rooms/${slug}/04-bathroom.webp`,
    `${base}/rooms/${slug}/05-kitchen.webp`,
    `${base}/rooms/${slug}/06-closet.webp`,
    `${base}/rooms/${slug}/07-window-meter.webp`,
    `${base}/rooms/${slug}/08-exterior-gate.webp`,
    `${base}/rooms/${slug}/09-balcony-corridor.webp`,
    `${base}/rooms/${slug}/10-security.webp`
  ];
};

export const seedMockRooms = [
  {
    id: 'r1',
    title: 'Studio Apt. Near KSL Gate 2',
    description: 'Bright bedsitter with a kitchenette corner and tiled floors. Quiet compound, five minutes from the KSL main gate.',
    roomType: 'bedsitter',
    rentKes: 8500,
    depositTerms: 'One month deposit (KES 8,500)',
    area: 'Karen',
    distances: { KSL: { walkMin: 10 }, JKUAT: { matatuMin: 12 }, Tangaza: { matatuMin: 10 }, CUEA: { matatuMin: 15 }, 'Co-op': { matatuMin: 25 } },
    matatuFareKes: 50,
    amenities: ['Water 24/7', 'WiFi', 'Tokens', 'Gated Security'],
    status: 'Taken',
    caretakerId: 'c1',
    whatsappNumber: '+254712345678',
    callNumber: '+254712345678'
  },
  {
    id: 'r2',
    title: 'Quiet Single Room, Rongai Stage',
    description: 'Single room with a wardrobe and study desk. Shared bathroom, cleaned daily.',
    roomType: 'single_room',
    rentKes: 4500,
    depositTerms: 'Half month deposit (KES 2,250)',
    area: 'Rongai',
    distances: { KSL: { matatuMin: 20 }, JKUAT: { matatuMin: 22 }, Tangaza: { matatuMin: 18 }, CUEA: { matatuMin: 15 }, 'Co-op': { matatuMin: 30 } },
    matatuFareKes: 60,
    amenities: ['Water 24/7', 'Tokens'],
    status: 'Vacant',
    caretakerId: 'c2',
    whatsappNumber: '+254722111222',
    callNumber: '+254722111222'
  },
  {
    id: 'r3',
    title: 'One Bedroom off Magadi Rd',
    description: 'Spacious one bedroom with a separate living area. Good for two sharing.',
    roomType: 'one_bedroom',
    rentKes: 13500,
    depositTerms: 'One month deposit + KES 2,000 water',
    area: 'Rongai',
    distances: { KSL: { matatuMin: 25 }, JKUAT: { matatuMin: 25 }, Tangaza: { matatuMin: 20 }, CUEA: { matatuMin: 18 }, 'Co-op': { matatuMin: 30 } },
    matatuFareKes: 70,
    amenities: ['Water 24/7', 'WiFi', 'Tokens', 'Gated Security'],
    status: 'Vacant',
    caretakerId: 'c2',
    whatsappNumber: '+254722111222',
    callNumber: '+254722111222'
  },
  {
    id: 'r4',
    title: 'Bedsitter Behind CUEA Hostels',
    description: 'Compact bedsitter, fitted kitchen shelf, 24-hour guard.',
    roomType: 'bedsitter',
    rentKes: 7000,
    depositTerms: 'One month deposit (KES 7,000)',
    area: 'Karen',
    distances: { KSL: { matatuMin: 15 }, JKUAT: { matatuMin: 12 }, Tangaza: { matatuMin: 8 }, CUEA: { walkMin: 7 }, 'Co-op': { matatuMin: 25 } },
    matatuFareKes: 40,
    amenities: ['Water 24/7', 'Gated Security', 'Tokens'],
    status: 'Vacant',
    caretakerId: 'c1',
    whatsappNumber: '+254712345678',
    callNumber: '+254712345678'
  },
  {
    id: 'r5',
    title: 'Budget Single, Gataka Rd',
    description: 'Simple single room, close to shops and the matatu stage.',
    roomType: 'single_room',
    rentKes: 4000,
    depositTerms: 'No deposit, first month upfront',
    area: 'Gataka',
    distances: { KSL: { matatuMin: 25 }, JKUAT: { matatuMin: 28 }, Tangaza: { matatuMin: 22 }, CUEA: { matatuMin: 20 }, 'Co-op': { matatuMin: 35 } },
    matatuFareKes: 60,
    amenities: ['Tokens'],
    status: 'Vacant',
    caretakerId: 'c3',
    whatsappNumber: '+254733444555',
    callNumber: '+254733444555'
  },
  {
    id: 'r6',
    title: 'Bright Bedsitter, Maasai Lodge',
    description: 'Sunny upper-floor bedsitter with balcony access.',
    roomType: 'bedsitter',
    rentKes: 6500,
    depositTerms: 'One month deposit (KES 6,500)',
    area: 'Maasai Lodge',
    distances: { KSL: { matatuMin: 15 }, JKUAT: { matatuMin: 18 }, Tangaza: { matatuMin: 12 }, CUEA: { matatuMin: 10 }, 'Co-op': { matatuMin: 30 } },
    matatuFareKes: 50,
    amenities: ['Water 24/7', 'WiFi', 'Tokens'],
    status: 'Vacant',
    caretakerId: 'c4',
    whatsappNumber: '+254711999800',
    callNumber: '+254711999800'
  },
  {
    id: 'r7',
    title: 'Single Room, Gataka Market',
    description: 'Single room in a family compound, quiet and secure.',
    roomType: 'single_room',
    rentKes: 5000,
    depositTerms: 'Half month deposit (KES 2,500)',
    area: 'Gataka',
    distances: { KSL: { matatuMin: 25 }, JKUAT: { matatuMin: 28 }, Tangaza: { matatuMin: 22 }, CUEA: { matatuMin: 20 }, 'Co-op': { matatuMin: 35 } },
    matatuFareKes: 60,
    amenities: ['Water 24/7', 'Gated Security'],
    status: 'Taken',
    caretakerId: 'c5',
    whatsappNumber: '+254700123123',
    callNumber: '+254700123123'
  },
  {
    id: 'r8',
    title: 'One Bedroom, Karen Plains',
    description: 'Modern one bedroom with fitted kitchen and parking.',
    roomType: 'one_bedroom',
    rentKes: 15000,
    depositTerms: 'One month deposit (KES 15,000)',
    area: 'Karen',
    distances: { KSL: { walkMin: 15 }, JKUAT: { matatuMin: 10 }, Tangaza: { matatuMin: 14 }, CUEA: { matatuMin: 12 }, 'Co-op': { matatuMin: 25 } },
    matatuFareKes: 50,
    amenities: ['Water 24/7', 'WiFi', 'Tokens', 'Gated Security'],
    status: 'Vacant',
    caretakerId: 'c4',
    whatsappNumber: '+254711999800',
    callNumber: '+254711999800'
  },
  {
    id: 'r9',
    title: 'Bedsitter near Tumaini, Rongai',
    description: 'Clean bedsitter with own bathroom and hot shower.',
    roomType: 'bedsitter',
    rentKes: 6000,
    depositTerms: 'One month deposit (KES 6,000)',
    area: 'Rongai',
    distances: { KSL: { matatuMin: 22 }, JKUAT: { matatuMin: 24 }, Tangaza: { matatuMin: 18 }, CUEA: { matatuMin: 15 }, 'Co-op': { matatuMin: 30 } },
    matatuFareKes: 60,
    amenities: ['Water 24/7', 'Tokens', 'WiFi'],
    status: 'Vacant',
    caretakerId: 'c2',
    whatsappNumber: '+254722111222',
    callNumber: '+254722111222'
  },
  {
    id: 'r10',
    title: 'Single Room, Gataka Junction',
    description: 'Affordable single with shared kitchen, five minutes from the stage.',
    roomType: 'single_room',
    rentKes: 4800,
    depositTerms: 'Half month deposit (KES 2,400)',
    area: 'Gataka',
    distances: { KSL: { matatuMin: 25 }, JKUAT: { matatuMin: 28 }, Tangaza: { matatuMin: 22 }, CUEA: { matatuMin: 20 }, 'Co-op': { matatuMin: 35 } },
    matatuFareKes: 60,
    amenities: ['Water 24/7'],
    status: 'Taken',
    caretakerId: 'c3',
    whatsappNumber: '+254733444555',
    callNumber: '+254733444555'
  },
  {
    id: 'r11',
    title: 'Bedsitter by Co-op Shuttle Stop',
    description: 'Bedsitter on the Co-op University shuttle route.',
    roomType: 'bedsitter',
    rentKes: 7500,
    depositTerms: 'One month deposit (KES 7,500)',
    area: 'Karen',
    distances: { KSL: { matatuMin: 18 }, JKUAT: { matatuMin: 16 }, Tangaza: { matatuMin: 18 }, CUEA: { matatuMin: 20 }, 'Co-op': { walkMin: 12 } },
    matatuFareKes: 50,
    amenities: ['Water 24/7', 'Gated Security', 'WiFi'],
    status: 'Vacant',
    caretakerId: 'c4',
    whatsappNumber: '+254711999800',
    callNumber: '+254711999800'
  },
  {
    id: 'r12',
    title: 'Hillside One Bedroom, Maasai Lodge',
    description: 'One bedroom with a hillside view, tiled throughout.',
    roomType: 'one_bedroom',
    rentKes: 11000,
    depositTerms: 'One month deposit (KES 11,000)',
    area: 'Maasai Lodge',
    distances: { KSL: { matatuMin: 16 }, JKUAT: { matatuMin: 18 }, Tangaza: { matatuMin: 14 }, CUEA: { matatuMin: 12 }, 'Co-op': { matatuMin: 30 } },
    matatuFareKes: 50,
    amenities: ['Water 24/7', 'Tokens', 'Gated Security'],
    status: 'Vacant',
    caretakerId: 'c5',
    whatsappNumber: '+254700123123',
    callNumber: '+254700123123'
  },
  {
    id: 'r13',
    title: 'Single Room, Maasai Lodge Rd',
    description: 'Neat single room, shared bathroom, borehole water.',
    roomType: 'single_room',
    rentKes: 5500,
    depositTerms: 'One month deposit (KES 5,500)',
    area: 'Maasai Lodge',
    distances: { KSL: { matatuMin: 15 }, JKUAT: { matatuMin: 18 }, Tangaza: { matatuMin: 12 }, CUEA: { matatuMin: 10 }, 'Co-op': { matatuMin: 30 } },
    matatuFareKes: 50,
    amenities: ['Water 24/7', 'Tokens'],
    status: 'Vacant',
    caretakerId: 'c1',
    whatsappNumber: '+254712345678',
    callNumber: '+254712345678'
  },
  {
    id: 'r14',
    title: 'Bedsitter 5 min from KSL',
    description: 'Walk to class. Bedsitter with fitted shelves and secure gate.',
    roomType: 'bedsitter',
    rentKes: 9000,
    depositTerms: 'One month deposit (KES 9,000)',
    area: 'Karen',
    distances: { KSL: { walkMin: 5 }, JKUAT: { walkMin: 12 }, Tangaza: { matatuMin: 12 }, CUEA: { matatuMin: 15 }, 'Co-op': { matatuMin: 25 } },
    matatuFareKes: 40,
    amenities: ['Water 24/7', 'WiFi', 'Gated Security', 'Tokens'],
    status: 'Taken',
    caretakerId: 'c1',
    whatsappNumber: '+254712345678',
    callNumber: '+254712345678'
  }
];

export const seedHostelRooms = [
  { id: 'h1', title: 'Elite Hostel', gender: 'Mixed', rentKes: 12500, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254707213055', meals: true, transport: true, distanceKm: 10, inGuide: true },
  { id: 'h2', title: 'Mirvins Hostel', gender: 'Mixed', rentKes: 14750, depositTerms: 'KES 3,000 non-refundable fee', area: 'Karen', phone: '+254723713732', meals: true, transport: true, distanceKm: 2.5, inGuide: true },
  { id: 'h3', title: 'Karen Gardens', gender: 'Ladies', rentKes: 13750, depositTerms: 'KES 3,000 non-refundable fee', area: 'Karen', phone: '+254724049619', meals: true, transport: true, distanceKm: 1.2, inGuide: true },
  { id: 'h4', title: "Chege's Place", gender: 'Mixed', rentKes: 10000, depositTerms: 'One month deposit', area: 'Karen', phone: '+254712543126', meals: false, transport: false, inGuide: true },
  { id: 'h5', title: "Bogani East Apartments (Wanyoike's)", gender: 'Mixed', rentKes: 11500, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254721709759', meals: false, transport: false, distanceKm: 1.5, inGuide: true },
  { id: 'h6', title: 'Starehe Hostel', gender: 'Mixed', rentKes: 12000, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254722474849', meals: false, transport: false, distanceKm: 1.5, inGuide: true },
  { id: 'h7', title: "Gardenia Men's Hostel", gender: 'Gents', rentKes: 16000, depositTerms: 'KES 3,000 non-refundable caution money', area: 'Karen', phone: '+254723411334', meals: true, transport: true, distanceKm: 1.5, inGuide: true },
  { id: 'h8', title: 'Lale Hostel', gender: 'Mixed', rentKes: 14250, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254722853679', meals: true, transport: true, distanceKm: 3.0, inGuide: true },
  { id: 'h9', title: 'Banaki Hostel', gender: 'Ladies', rentKes: 13000, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254720773363', meals: true, transport: true, distanceKm: 2.0, inGuide: true },
  { id: 'h10', title: 'Campus Lane', gender: 'Ladies', rentKes: 12000, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254722527293', meals: true, transport: true, distanceKm: 1.0, inGuide: true },
  { id: 'h11', title: 'Stanjo Hostels', gender: 'Mixed', rentKes: 15000, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254711308207', meals: false, transport: false, distanceKm: 0.8, inGuide: true },
  { id: 'h12', title: 'St. Francis Ladies Hostel', gender: 'Ladies', rentKes: 10000, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254712739345', meals: false, transport: false, inGuide: true },
  { id: 'h13', title: 'Buon Villa Hostels', gender: 'Mixed', rentKes: 10000, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254722703464', meals: true, transport: false, inGuide: true },
  { id: 'h14', title: 'Qejani Student Residences', gender: 'Mixed', rentKes: 12500, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254800733533', meals: false, transport: false, distanceKm: 0.8, inGuide: true },
  { id: 'h15', title: 'Charles Heery Hostels', gender: 'Mixed', rentKes: 12000, depositTerms: 'Ask the hostel', area: 'Karen', phone: '+254757527814', meals: false, transport: false, distanceKm: 0.2, inGuide: true },
  { id: 'h16', title: 'Timpheys Hostel', gender: 'Mixed', rentKes: 5000, depositTerms: 'Ask the hostel', area: 'Rongai', phone: '+254769733329', meals: true, transport: false, distanceKm: 6.0, inGuide: true }
];

export const seedCaretakersList = [
  { id: 'c-muthoni', name: 'Faith Muthoni', phone: '+254712345670', email: 'muthoni@example.com', isVerified: true, joinedDaysAgo: 90 },
  { id: 'c-kamau', name: 'Peter Kamau', phone: '+254722334455', email: 'kamau@example.com', isVerified: false, joinedDaysAgo: 30 },
  { id: 'c1', name: 'Mama Wanjiru', phone: '+254712345678', email: 'wanjiru@example.com', isVerified: true, joinedDaysAgo: 400 },
  { id: 'c2', name: 'John Otieno', phone: '+254722111222', email: 'otieno@example.com', isVerified: true, joinedDaysAgo: 260 },
  { id: 'c3', name: 'Grace Muthoni', phone: '+254733444555', email: 'gracemuthoni@example.com', isVerified: false, joinedDaysAgo: 60 },
  { id: 'c4', name: 'Peter Kiprono', phone: '+254711999800', email: 'kiprono@example.com', isVerified: true, joinedDaysAgo: 180 },
  { id: 'c5', name: 'Ann Njeri', phone: '+254700123123', email: 'njeri@example.com', isVerified: false, joinedDaysAgo: 20 },
  ...seedHostelRooms.map((h) => ({
    id: `hc-${h.id}`,
    name: h.title,
    phone: h.phone,
    email: `hostel-${h.id}@rommie.co.ke`,
    isVerified: false,
    joinedDaysAgo: 30
  }))
];

/**
 * Seed in-memory database instance (used for automated Vitest testing & zero-dependency dev).
 */
export async function seedDatabase(database) {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const studentHash = bcrypt.hashSync('student123', salt);
  const passwordHash = bcrypt.hashSync('password123', salt);
  const caretakerHash = bcrypt.hashSync('caretaker123', salt);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. Seed Platform Admins
  await database.createUser({
    id: 'u-admin-1',
    email: 'admin@rommie.co.ke',
    phone: '+254700000001',
    name: 'Platform Administrator',
    role: 'admin',
    passwordHash: adminHash,
    emailVerified: true,
    isGoogle: false
  });

  await database.createUser({
    id: 'a1',
    email: 'admin@rommie.example',
    phone: '+254700000000',
    name: 'Rommie Admin',
    role: 'admin',
    passwordHash: passwordHash,
    emailVerified: true,
    isGoogle: false
  });

  // 2. Seed Student Accounts
  await database.createUser({
    id: 'u-kevin',
    email: 'kevin@cuea.edu',
    phone: '+254733445566',
    name: 'Kevin Omondi',
    role: 'student',
    school: 'Catholic University of Eastern Africa (CUEA)',
    passwordHash: studentHash,
    emailVerified: true,
    isGoogle: false
  });

  await database.createUser({
    id: 'u1',
    email: 'amina@example.com',
    phone: '+254711111111',
    name: 'Amina Student',
    role: 'student',
    school: 'Catholic University of Eastern Africa (CUEA)',
    passwordHash: passwordHash,
    emailVerified: true,
    isGoogle: false
  });

  // 3. Seed Caretakers (User + Caretaker Profile)
  for (const ct of seedCaretakersList) {
    await database.createUser({
      id: ct.id,
      email: ct.email,
      phone: ct.phone,
      name: ct.name,
      role: 'caretaker',
      passwordHash: caretakerHash,
      emailVerified: true,
      isGoogle: false
    });

    await database.createCaretaker({
      id: ct.id,
      name: ct.name,
      phone: ct.phone,
      isVerified: ct.isVerified,
      isSuspended: false,
      joinedAt: new Date(now - ct.joinedDaysAgo * dayMs).toISOString()
    });
  }

  // 4. Seed Standard Listings
  await database.createRoom({
    id: 'r-ksl-bedsitter-1',
    title: 'Sunny Modern Bedsitter near KSL Gate 2',
    description: 'Clean borehole water 24/7, tiled floors, prepaid token meter, perimeter wall with electric fence.',
    roomType: 'bedsitter',
    rentKes: 8500,
    depositTerms: '1 month rent + KES 1,000 electricity token deposit',
    area: 'Karen',
    distances: {
      ksl: { walkMin: 8, matatuMin: 3 },
      cuea: { walkMin: 22, matatuMin: 8 },
      jkuat: { walkMin: 30, matatuMin: 10 }
    },
    matatuFareKes: 40,
    amenities: ['Water 24/7', 'WiFi', 'Tokens', 'Gated Security'],
    photos: generate10Photos('ksl-bedsitter-1'),
    mapLink: 'https://maps.google.com/?q=-1.3541,36.7118',
    status: 'Vacant',
    lastConfirmedVacantAt: new Date().toISOString(),
    whatsappNumber: '+254712345670',
    callNumber: '+254712345670',
    caretakerId: 'c-muthoni',
    buildingId: 'bld-sunshine-karen'
  });

  await database.createRoom({
    id: 'r-cuea-single-1',
    title: 'Spacious Single Room with Balcony near CUEA',
    description: 'Quiet study environment, free high-speed fiber WiFi, shared clean washrooms cleaned daily.',
    roomType: 'single_room',
    rentKes: 6000,
    depositTerms: '1 month rent deposit',
    area: 'Gataka',
    distances: {
      cuea: { walkMin: 12, matatuMin: 5 },
      tangaza: { walkMin: 15, matatuMin: 6 },
      ksl: { walkMin: 25, matatuMin: 10 }
    },
    matatuFareKes: 30,
    amenities: ['Water 24/7', 'WiFi', 'Gated Security'],
    photos: generate10Photos('cuea-single-1'),
    mapLink: 'https://maps.google.com/?q=-1.3621,36.7245',
    status: 'Vacant',
    lastConfirmedVacantAt: new Date().toISOString(),
    whatsappNumber: '+254712345670',
    callNumber: '+254712345670',
    caretakerId: 'c-muthoni'
  });

  await database.createRoom({
    id: 'r-rongai-onebed-1',
    title: 'Executive 1 Bedroom Apartment near Tuskys Rongai',
    description: 'Large kitchen with cabinets, modern instant shower, backup generator for water pump.',
    roomType: 'one_bedroom',
    rentKes: 13000,
    depositTerms: '1 month rent + KES 2,000 water & token deposit',
    area: 'Rongai',
    distances: {
      coop: { walkMin: 45, matatuMin: 15 },
      cuea: { walkMin: 50, matatuMin: 20 },
      ksl: { walkMin: 60, matatuMin: 25 }
    },
    matatuFareKes: 50,
    amenities: ['Water 24/7', 'WiFi', 'Tokens', 'Gated Security'],
    photos: generate10Photos('rongai-onebed-1'),
    mapLink: 'https://maps.google.com/?q=-1.3951,36.7588',
    status: 'Vacant',
    lastConfirmedVacantAt: new Date().toISOString(),
    whatsappNumber: '+254722334455',
    callNumber: '+254722334455',
    caretakerId: 'c-kamau'
  });

  await database.createRoom({
    id: 'r-karen-hostel-1',
    title: 'St. Jude Executive Ladies Hostel Karen',
    description: 'All meals included (breakfast & dinner), private shuttle to CUEA and Tangaza gates, 24/7 matron.',
    roomType: 'hostel',
    rentKes: 18000,
    depositTerms: 'KES 2,000 non-refundable registration fee',
    area: 'Karen',
    distances: {
      cuea: { walkMin: 10, matatuMin: 3 },
      tangaza: { walkMin: 8, matatuMin: 2 }
    },
    matatuFareKes: 0,
    amenities: ['Water 24/7', 'WiFi', 'Gated Security'],
    photos: generate10Photos('karen-hostel-1'),
    mapLink: 'https://maps.google.com/?q=-1.3498,36.7092',
    status: 'Vacant',
    lastConfirmedVacantAt: new Date().toISOString(),
    whatsappNumber: '+254712345670',
    callNumber: '+254712345670',
    caretakerId: 'c-muthoni',
    gender: 'Ladies',
    meals: true,
    transport: true,
    distanceKm: 0.8,
    registrationFee: 2000,
    inGuide: true,
    roomOptions: [
      { id: 'opt-1', label: 'Single Ensuite', rent: 24000, billing: 'semester', photos: [] },
      { id: 'opt-2', label: '2 Sharing', rent: 18000, billing: 'semester', photos: [] },
      { id: 'opt-3', label: '4 Sharing', rent: 14000, billing: 'semester', photos: [] }
    ]
  });

  // 5. Seed r1 to r14
  for (const r of seedMockRooms) {
    await database.createRoom({
      id: r.id,
      title: r.title,
      description: r.description,
      roomType: r.roomType,
      rentKes: r.rentKes,
      depositTerms: r.depositTerms,
      area: r.area,
      distances: r.distances || {},
      matatuFareKes: r.matatuFareKes || 0,
      amenities: r.amenities || [],
      photos: generate10Photos(r.id),
      mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.area + ', Nairobi')}`,
      status: r.status,
      lastConfirmedVacantAt: new Date().toISOString(),
      whatsappNumber: r.whatsappNumber,
      callNumber: r.callNumber,
      caretakerId: r.caretakerId,
      hidden: false
    });
  }

  // 6. Seed h1 to h16
  for (const h of seedHostelRooms) {
    await database.createRoom({
      id: h.id,
      title: h.title,
      description: `${h.gender} hostel with reliable student accommodations.`,
      roomType: 'hostel',
      rentKes: h.rentKes,
      depositTerms: h.depositTerms,
      area: h.area,
      distances: {},
      matatuFareKes: 0,
      amenities: ['Water 24/7', 'WiFi', 'Gated Security'],
      photos: generate10Photos(h.id),
      mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.title + ', Karen, Nairobi')}`,
      status: 'Vacant',
      lastConfirmedVacantAt: new Date().toISOString(),
      whatsappNumber: h.phone,
      callNumber: h.phone,
      caretakerId: `hc-${h.id}`,
      gender: h.gender,
      meals: h.meals,
      transport: h.transport,
      distanceKm: h.distanceKm || null,
      inGuide: Boolean(h.inGuide),
      hidden: false,
      roomOptions: [
        { id: `opt-${h.id}-1`, label: 'Room', rent: h.rentKes, billing: 'month', photos: [] }
      ]
    });
  }

  // 7. Seed Pending Caretaker KYC Verification
  await database.createVerificationRequest({
    userId: 'c-kamau',
    documentUrl: 'https://cdn.rommie.co.ke/kyc/kamau-national-id.pdf',
    documentName: 'Peter Kamau - Kenyan National ID'
  });

  console.log('Successfully seeded in-memory database with all rooms, caretakers, and demo users.');
}

/**
 * Seed real PostgreSQL database (Supabase, Neon, Railway, Docker, AWS RDS)
 */
export async function seedRemotePostgres(connectionUrl) {
  const url = connectionUrl || process.env.DATABASE_URL || config.databaseUrl;
  if (!url) {
    throw new Error('No DATABASE_URL configured. Please provide a PostgreSQL connection string.');
  }

  const pool = new Pool({
    connectionString: url,
    ssl: url.includes('sslmode=require') || url.includes('neon.tech') || url.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : false
  });

  try {
    console.log('🔌 Connecting to remote PostgreSQL database...');
    const testResult = await pool.query('SELECT current_database(), current_user;');
    console.log(`Connected to database "${testResult.rows[0].current_database}" as user "${testResult.rows[0].current_user}".`);

    // 1. Check if legacy UUID column exists and migrate if needed
    const colTypeCheck = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id';
    `);

    if (colTypeCheck.rows.length > 0 && colTypeCheck.rows[0].data_type === 'uuid') {
      console.log('🔄 Migrating table schema to VARCHAR(64) IDs...');
      await pool.query(`
        DROP TABLE IF EXISTS email_otps, site_settings, contact_events, activity_entries, 
        verification_requests, listing_reports, vacancy_alerts, saved_rooms, 
        room_options, rooms, caretakers, users CASCADE;
      `);
      console.log('Legacy tables replaced.');
    }

    // 2. Ensure Schema Exists
    console.log('Verifying table schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log('Schema verified.');

    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const studentHash = bcrypt.hashSync('student123', salt);
    const passwordHash = bcrypt.hashSync('password123', salt);
    const caretakerHash = bcrypt.hashSync('caretaker123', salt);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 3. Seed Users
    console.log('Seeding demo users (Admins, Students, Caretakers)...');
    const allUsers = [
      {
        id: 'u-admin-1',
        email: 'admin@rommie.co.ke',
        phone: '+254700000001',
        password_hash: adminHash,
        name: 'Platform Administrator',
        role: 'admin',
        email_verified: true,
        is_google: false
      },
      {
        id: 'a1',
        email: 'admin@rommie.example',
        phone: '+254700000000',
        password_hash: passwordHash,
        name: 'Rommie Admin',
        role: 'admin',
        email_verified: true,
        is_google: false
      },
      {
        id: 'u-kevin',
        email: 'kevin@cuea.edu',
        phone: '+254733445566',
        password_hash: studentHash,
        name: 'Kevin Omondi',
        school: 'Catholic University of Eastern Africa (CUEA)',
        role: 'student',
        email_verified: true,
        is_google: false
      },
      {
        id: 'u1',
        email: 'amina@example.com',
        phone: '+254711111111',
        password_hash: passwordHash,
        name: 'Amina Student',
        school: 'Catholic University of Eastern Africa (CUEA)',
        role: 'student',
        email_verified: true,
        is_google: false
      },
      ...seedCaretakersList.map((ct) => ({
        id: ct.id,
        email: ct.email,
        phone: ct.phone,
        password_hash: caretakerHash,
        name: ct.name,
        role: 'caretaker',
        email_verified: true,
        is_google: false
      }))
    ];

    for (const u of allUsers) {
      await pool.query(
        `INSERT INTO users (id, email, phone, password_hash, name, role, email_verified, is_google)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           email_verified = EXCLUDED.email_verified;`,
        [u.id, u.email, u.phone, u.password_hash, u.name, u.role, u.email_verified, u.is_google]
      );
    }
    console.log(`Seeded ${allUsers.length} users into PostgreSQL.`);

    // 4. Seed Caretaker Profiles
    console.log('Seeding caretaker profiles...');
    for (const ct of seedCaretakersList) {
      await pool.query(
        `INSERT INTO caretakers (id, name, phone, is_verified, is_suspended, joined_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           is_verified = EXCLUDED.is_verified,
           is_suspended = EXCLUDED.is_suspended;`,
        [ct.id, ct.name, ct.phone, ct.isVerified, false, new Date(now - ct.joinedDaysAgo * dayMs).toISOString()]
      );
    }
    console.log(`Seeded ${seedCaretakersList.length} caretaker profiles.`);

    // 5. Seed Property Listings
    console.log('Seeding property listings with 10 photos...');
    const allListings = [
      {
        id: 'r-ksl-bedsitter-1',
        title: 'Sunny Modern Bedsitter near KSL Gate 2',
        description: 'Clean borehole water 24/7, tiled floors, prepaid token meter, perimeter wall with electric fence.',
        roomType: 'bedsitter',
        rentKes: 8500,
        depositTerms: '1 month rent + KES 1,000 electricity token deposit',
        area: 'Karen',
        distances: { ksl: { walkMin: 8, matatuMin: 3 }, cuea: { walkMin: 22, matatuMin: 8 }, jkuat: { walkMin: 30, matatuMin: 10 } },
        matatuFareKes: 40,
        amenities: ['Water 24/7', 'WiFi', 'Tokens', 'Gated Security'],
        photos: generate10Photos('ksl-bedsitter-1'),
        mapLink: 'https://maps.google.com/?q=-1.3541,36.7118',
        status: 'Vacant',
        lastConfirmedVacantAt: new Date().toISOString(),
        whatsappNumber: '+254712345670',
        callNumber: '+254712345670',
        caretakerId: 'c-muthoni',
        buildingId: 'bld-sunshine-karen',
        gender: null,
        meals: false,
        transport: false,
        distanceKm: null,
        registrationFee: 0,
        inGuide: false
      },
      {
        id: 'r-cuea-single-1',
        title: 'Spacious Single Room with Balcony near CUEA',
        description: 'Quiet study environment, free high-speed fiber WiFi, shared clean washrooms cleaned daily.',
        roomType: 'single_room',
        rentKes: 6000,
        depositTerms: '1 month rent deposit',
        area: 'Gataka',
        distances: { cuea: { walkMin: 12, matatuMin: 5 }, tangaza: { walkMin: 15, matatuMin: 6 }, ksl: { walkMin: 25, matatuMin: 10 } },
        matatuFareKes: 30,
        amenities: ['Water 24/7', 'WiFi', 'Gated Security'],
        photos: generate10Photos('cuea-single-1'),
        mapLink: 'https://maps.google.com/?q=-1.3621,36.7245',
        status: 'Vacant',
        lastConfirmedVacantAt: new Date().toISOString(),
        whatsappNumber: '+254712345670',
        callNumber: '+254712345670',
        caretakerId: 'c-muthoni',
        buildingId: null,
        gender: null,
        meals: false,
        transport: false,
        distanceKm: null,
        registrationFee: 0,
        inGuide: false
      },
      {
        id: 'r-rongai-onebed-1',
        title: 'Executive 1 Bedroom Apartment near Tuskys Rongai',
        description: 'Large kitchen with cabinets, modern instant shower, backup generator for water pump.',
        roomType: 'one_bedroom',
        rentKes: 13000,
        depositTerms: '1 month rent + KES 2,000 water & token deposit',
        area: 'Rongai',
        distances: { coop: { walkMin: 45, matatuMin: 15 }, cuea: { walkMin: 50, matatuMin: 20 }, ksl: { walkMin: 60, matatuMin: 25 } },
        matatuFareKes: 50,
        amenities: ['Water 24/7', 'WiFi', 'Tokens', 'Gated Security'],
        photos: generate10Photos('rongai-onebed-1'),
        mapLink: 'https://maps.google.com/?q=-1.3951,36.7588',
        status: 'Vacant',
        lastConfirmedVacantAt: new Date().toISOString(),
        whatsappNumber: '+254722334455',
        callNumber: '+254722334455',
        caretakerId: 'c-kamau',
        buildingId: null,
        gender: null,
        meals: false,
        transport: false,
        distanceKm: null,
        registrationFee: 0,
        inGuide: false
      },
      {
        id: 'r-karen-hostel-1',
        title: 'St. Jude Executive Ladies Hostel Karen',
        description: 'All meals included (breakfast & dinner), private shuttle to CUEA and Tangaza gates, 24/7 matron.',
        roomType: 'hostel',
        rentKes: 18000,
        depositTerms: 'KES 2,000 non-refundable registration fee',
        area: 'Karen',
        distances: { cuea: { walkMin: 10, matatuMin: 3 }, tangaza: { walkMin: 8, matatuMin: 2 } },
        matatuFareKes: 0,
        amenities: ['Water 24/7', 'WiFi', 'Gated Security'],
        photos: generate10Photos('karen-hostel-1'),
        mapLink: 'https://maps.google.com/?q=-1.3498,36.7092',
        status: 'Vacant',
        lastConfirmedVacantAt: new Date().toISOString(),
        whatsappNumber: '+254712345670',
        callNumber: '+254712345670',
        caretakerId: 'c-muthoni',
        buildingId: null,
        gender: 'Ladies',
        meals: true,
        transport: true,
        distanceKm: 0.8,
        registrationFee: 2000,
        inGuide: true
      },
      ...seedMockRooms.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        roomType: r.roomType,
        rentKes: r.rentKes,
        depositTerms: r.depositTerms,
        area: r.area,
        distances: r.distances || {},
        matatuFareKes: r.matatuFareKes || 0,
        amenities: r.amenities || [],
        photos: generate10Photos(r.id),
        mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.area + ', Nairobi')}`,
        status: r.status,
        lastConfirmedVacantAt: new Date().toISOString(),
        whatsappNumber: r.whatsappNumber,
        callNumber: r.callNumber,
        caretakerId: r.caretakerId,
        buildingId: null,
        gender: null,
        meals: false,
        transport: false,
        distanceKm: null,
        registrationFee: 0,
        inGuide: false
      })),
      ...seedHostelRooms.map((h) => ({
        id: h.id,
        title: h.title,
        description: `${h.gender} hostel with reliable student accommodations.`,
        roomType: 'hostel',
        rentKes: h.rentKes,
        depositTerms: h.depositTerms,
        area: h.area,
        distances: {},
        matatuFareKes: 0,
        amenities: ['Water 24/7', 'WiFi', 'Gated Security'],
        photos: generate10Photos(h.id),
        mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.title + ', Karen, Nairobi')}`,
        status: 'Vacant',
        lastConfirmedVacantAt: new Date().toISOString(),
        whatsappNumber: h.phone,
        callNumber: h.phone,
        caretakerId: `hc-${h.id}`,
        buildingId: null,
        gender: h.gender,
        meals: h.meals,
        transport: h.transport,
        distanceKm: h.distanceKm || null,
        registrationFee: 0,
        inGuide: Boolean(h.inGuide)
      }))
    ];

    for (const r of allListings) {
      await pool.query(
        `INSERT INTO rooms (
          id, title, description, room_type, rent_kes, deposit_terms, area,
          distances, matatu_fare_kes, amenities, photos, map_link, status,
          last_confirmed_vacant_at, whatsapp_number, call_number, caretaker_id,
          building_id, gender, meals, transport, distance_km, registration_fee, in_guide
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          rent_kes = EXCLUDED.rent_kes,
          photos = EXCLUDED.photos,
          status = EXCLUDED.status,
          last_confirmed_vacant_at = EXCLUDED.last_confirmed_vacant_at;`,
        [
          r.id, r.title, r.description, r.roomType, r.rentKes, r.depositTerms, r.area,
          JSON.stringify(r.distances), r.matatuFareKes, r.amenities, r.photos, r.mapLink, r.status,
          r.lastConfirmedVacantAt, r.whatsappNumber, r.callNumber, r.caretakerId,
          r.buildingId, r.gender, r.meals, r.transport, r.distanceKm, r.registrationFee, r.inGuide
        ]
      );
    }
    console.log(`Seeded ${allListings.length} listings into PostgreSQL.`);

    // 6. Seed Hostel Room Options
    console.log('Seeding hostel room options...');
    const roomOptions = [
      { id: 'opt-1', roomId: 'r-karen-hostel-1', label: 'Single Ensuite', rent: 24000, billing: 'semester' },
      { id: 'opt-2', roomId: 'r-karen-hostel-1', label: '2 Sharing', rent: 18000, billing: 'semester' },
      { id: 'opt-3', roomId: 'r-karen-hostel-1', label: '4 Sharing', rent: 14000, billing: 'semester' },
      ...seedHostelRooms.map((h) => ({
        id: `opt-${h.id}-1`,
        roomId: h.id,
        label: 'Standard Room',
        rent: h.rentKes,
        billing: 'month'
      }))
    ];

    for (const opt of roomOptions) {
      await pool.query(
        `INSERT INTO room_options (id, room_id, label, rent, billing)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           label = EXCLUDED.label,
           rent = EXCLUDED.rent;`,
        [opt.id, opt.roomId, opt.label, opt.rent, opt.billing]
      );
    }
    console.log(`Seeded ${roomOptions.length} hostel options into PostgreSQL.`);

    // 7. Seed Pending Caretaker KYC Verification
    console.log('Seeding pending KYC verification request...');
    await pool.query(
      `INSERT INTO verification_requests (id, user_id, kind, document_url, document_name, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING;`,
      [
        'ver-kamau-1',
        'c-kamau',
        'caretaker',
        'https://cdn.rommie.co.ke/kyc/kamau-national-id.pdf',
        'Peter Kamau - Kenyan National ID',
        'pending'
      ]
    );

    // 8. Seed Site Settings
    console.log('Seeding site settings...');
    await pool.query(
      `INSERT INTO site_settings (id, whatsapp, phone, email, hours, location)
       VALUES (1, '+254711223344', '+254711223344', 'hello@rommie.co.ke', 'Mon-Sat, 8am - 6pm EAT', 'Karen / Rongai, Nairobi, Kenya')
       ON CONFLICT (id) DO UPDATE SET
         whatsapp = EXCLUDED.whatsapp,
         email = EXCLUDED.email;`
    );

    console.log('========================================================');
    console.log('Remote PostgreSQL database seeded successfully!');
    console.log('========================================================');
  } catch (err) {
    console.error('Remote seeding failed:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

// CLI Execution handler
if (process.argv[1]?.endsWith('seed.js')) {
  const targetUrl = process.env.DATABASE_URL || config.databaseUrl;

  if (targetUrl) {
    console.log(`Detected DATABASE_URL. Target database configured.`);
    seedRemotePostgres(targetUrl)
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('Fatal error during remote seeding:', err.message);
        process.exit(1);
      });
  } else {
    console.log('ℹ️  No DATABASE_URL set. Seeding in-memory state engine...');
    import('./db.js').then(async ({ db }) => {
      await seedDatabase(db);
      console.log('In-memory database seeded. (Set DATABASE_URL in backend/.env to seed a real PostgreSQL database).');
      process.exit(0);
    });
  }
}

import r1 from "@/assets/room-1.jpg";
import r2 from "@/assets/room-2.jpg";
import r3 from "@/assets/room-3.jpg";
import r4 from "@/assets/room-4.jpg";
import { cheapestMonthly } from "@/lib/format";
import { hostelSeeds } from "@/data/hostels";
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();
const P = [r1, r2, r3, r4];
const photos = (start) => [0, 1, 2, 3, 4].map((i) => P[(start + i) % 4]);
export const caretakers = [
    { id: "c1", name: "Mama Wanjiru", phone: "+254712345678", verified: true, trustScore: 92, joinedAt: daysAgo(400) },
    { id: "c2", name: "John Otieno", phone: "+254722111222", verified: true, trustScore: 84, joinedAt: daysAgo(260) },
    { id: "c3", name: "Grace Muthoni", phone: "+254733444555", verified: false, trustScore: 61, joinedAt: daysAgo(60) },
    { id: "c4", name: "Peter Kiprono", phone: "+254711999888", verified: true, trustScore: 78, joinedAt: daysAgo(180) },
    { id: "c5", name: "Ann Njeri", phone: "+254700123123", verified: false, trustScore: 55, joinedAt: daysAgo(20) },
];
const seeds = [
    { id: "r1", title: "Studio Apt. Near KSL Gate 2", description: "Bright bedsitter with a kitchenette corner and tiled floors. Quiet compound, five minutes from the KSL main gate.", roomType: "bedsitter", rentKes: 8500, depositTerms: "One month deposit (KES 8,500)", area: "Karen", distances: { KSL: { walkMin: 10 }, JKUAT: { matatuMin: 12 }, Tangaza: { matatuMin: 10 }, CUEA: { matatuMin: 15 }, "Co-op": { matatuMin: 25 } }, matatuFareKes: 50, amenities: ["Water 24/7", "WiFi", "Tokens", "Gated Security"], status: "Taken", caretakerId: "c1", confirmedDaysAgo: 16, photoStart: 0 },
    { id: "r2", title: "Quiet Single Room, Rongai Stage", description: "Single room with a wardrobe and study desk. Shared bathroom, cleaned daily.", roomType: "single_room", rentKes: 4500, depositTerms: "Half month deposit (KES 2,250)", area: "Rongai", distances: { KSL: { matatuMin: 20 }, JKUAT: { matatuMin: 22 }, Tangaza: { matatuMin: 18 }, CUEA: { matatuMin: 15 }, "Co-op": { matatuMin: 30 } }, matatuFareKes: 60, amenities: ["Water 24/7", "Tokens"], status: "Vacant", caretakerId: "c2", confirmedDaysAgo: 1, photoStart: 1 },
    { id: "r3", title: "One Bedroom off Magadi Rd", description: "Spacious one bedroom with a separate living area. Good for two sharing.", roomType: "one_bedroom", rentKes: 13500, depositTerms: "One month deposit + KES 2,000 water", area: "Rongai", distances: { KSL: { matatuMin: 25 }, JKUAT: { matatuMin: 25 }, Tangaza: { matatuMin: 20 }, CUEA: { matatuMin: 18 }, "Co-op": { matatuMin: 30 } }, matatuFareKes: 70, amenities: ["Water 24/7", "WiFi", "Tokens", "Gated Security"], status: "Vacant", caretakerId: "c2", confirmedDaysAgo: 5, photoStart: 2 },
    { id: "r4", title: "Bedsitter Behind CUEA Hostels", description: "Compact bedsitter, fitted kitchen shelf, 24-hour guard.", roomType: "bedsitter", rentKes: 7000, depositTerms: "One month deposit (KES 7,000)", area: "Karen", distances: { KSL: { matatuMin: 15 }, JKUAT: { matatuMin: 12 }, Tangaza: { matatuMin: 8 }, CUEA: { walkMin: 7 }, "Co-op": { matatuMin: 25 } }, matatuFareKes: 40, amenities: ["Water 24/7", "Gated Security", "Tokens"], status: "Vacant", caretakerId: "c1", confirmedDaysAgo: 0, photoStart: 3 },
    { id: "r5", title: "Budget Single, Gataka Rd", description: "Simple single room, close to shops and the matatu stage.", roomType: "single_room", rentKes: 4000, depositTerms: "No deposit, first month upfront", area: "Gataka", distances: { KSL: { matatuMin: 25 }, JKUAT: { matatuMin: 28 }, Tangaza: { matatuMin: 22 }, CUEA: { matatuMin: 20 }, "Co-op": { matatuMin: 35 } }, matatuFareKes: 60, amenities: ["Tokens"], status: "Vacant", caretakerId: "c3", confirmedDaysAgo: 18, photoStart: 1 },
    { id: "r6", title: "Bright Bedsitter, Maasai Lodge", description: "Sunny upper-floor bedsitter with balcony access.", roomType: "bedsitter", rentKes: 6500, depositTerms: "One month deposit (KES 6,500)", area: "Maasai Lodge", distances: { KSL: { matatuMin: 15 }, JKUAT: { matatuMin: 18 }, Tangaza: { matatuMin: 12 }, CUEA: { matatuMin: 10 }, "Co-op": { matatuMin: 30 } }, matatuFareKes: 50, amenities: ["Water 24/7", "WiFi", "Tokens"], status: "Vacant", caretakerId: "c4", confirmedDaysAgo: 2, photoStart: 0 },
    { id: "r7", title: "Single Room, Gataka Market", description: "Single room in a family compound, quiet and secure.", roomType: "single_room", rentKes: 5000, depositTerms: "Half month deposit (KES 2,500)", area: "Gataka", distances: { KSL: { matatuMin: 25 }, JKUAT: { matatuMin: 28 }, Tangaza: { matatuMin: 22 }, CUEA: { matatuMin: 20 }, "Co-op": { matatuMin: 35 } }, matatuFareKes: 60, amenities: ["Water 24/7", "Gated Security"], status: "Taken", caretakerId: "c5", confirmedDaysAgo: 9, photoStart: 2 },
    { id: "r8", title: "One Bedroom, Karen Plains", description: "Modern one bedroom with fitted kitchen and parking.", roomType: "one_bedroom", rentKes: 15000, depositTerms: "One month deposit (KES 15,000)", area: "Karen", distances: { KSL: { walkMin: 15 }, JKUAT: { matatuMin: 10 }, Tangaza: { matatuMin: 14 }, CUEA: { matatuMin: 12 }, "Co-op": { matatuMin: 25 } }, matatuFareKes: 50, amenities: ["Water 24/7", "WiFi", "Tokens", "Gated Security"], status: "Vacant", caretakerId: "c4", confirmedDaysAgo: 6, photoStart: 2 },
    { id: "r9", title: "Bedsitter near Tumaini, Rongai", description: "Clean bedsitter with own bathroom and hot shower.", roomType: "bedsitter", rentKes: 6000, depositTerms: "One month deposit (KES 6,000)", area: "Rongai", distances: { KSL: { matatuMin: 22 }, JKUAT: { matatuMin: 24 }, Tangaza: { matatuMin: 18 }, CUEA: { matatuMin: 15 }, "Co-op": { matatuMin: 30 } }, matatuFareKes: 60, amenities: ["Water 24/7", "Tokens", "WiFi"], status: "Vacant", caretakerId: "c2", confirmedDaysAgo: 4, photoStart: 0 },
    { id: "r10", title: "Single Room, Gataka Junction", description: "Affordable single with shared kitchen, five minutes from the stage.", roomType: "single_room", rentKes: 4800, depositTerms: "Half month deposit (KES 2,400)", area: "Gataka", distances: { KSL: { matatuMin: 25 }, JKUAT: { matatuMin: 28 }, Tangaza: { matatuMin: 22 }, CUEA: { matatuMin: 20 }, "Co-op": { matatuMin: 35 } }, matatuFareKes: 60, amenities: ["Water 24/7"], status: "Taken", caretakerId: "c3", confirmedDaysAgo: 22, photoStart: 3 },
    { id: "r11", title: "Bedsitter by Co-op Shuttle Stop", description: "Bedsitter on the Co-op University shuttle route.", roomType: "bedsitter", rentKes: 7500, depositTerms: "One month deposit (KES 7,500)", area: "Karen", distances: { KSL: { matatuMin: 18 }, JKUAT: { matatuMin: 16 }, Tangaza: { matatuMin: 18 }, CUEA: { matatuMin: 20 }, "Co-op": { walkMin: 12 } }, matatuFareKes: 50, amenities: ["Water 24/7", "Gated Security", "WiFi"], status: "Vacant", caretakerId: "c4", confirmedDaysAgo: 1, photoStart: 1 },
    { id: "r12", title: "Hillside One Bedroom, Maasai Lodge", description: "One bedroom with a hillside view, tiled throughout.", roomType: "one_bedroom", rentKes: 11000, depositTerms: "One month deposit (KES 11,000)", area: "Maasai Lodge", distances: { KSL: { matatuMin: 16 }, JKUAT: { matatuMin: 18 }, Tangaza: { matatuMin: 14 }, CUEA: { matatuMin: 12 }, "Co-op": { matatuMin: 30 } }, matatuFareKes: 50, amenities: ["Water 24/7", "Tokens", "Gated Security"], status: "Vacant", caretakerId: "c5", confirmedDaysAgo: 15, photoStart: 2 },
    { id: "r13", title: "Single Room, Maasai Lodge Rd", description: "Neat single room, shared bathroom, borehole water.", roomType: "single_room", rentKes: 5500, depositTerms: "One month deposit (KES 5,500)", area: "Maasai Lodge", distances: { KSL: { matatuMin: 15 }, JKUAT: { matatuMin: 18 }, Tangaza: { matatuMin: 12 }, CUEA: { matatuMin: 10 }, "Co-op": { matatuMin: 30 } }, matatuFareKes: 50, amenities: ["Water 24/7", "Tokens"], status: "Vacant", caretakerId: "c1", confirmedDaysAgo: 7, photoStart: 1 },
    { id: "r14", title: "Bedsitter 5 min from KSL", description: "Walk to class. Bedsitter with fitted shelves and secure gate.", roomType: "bedsitter", rentKes: 9000, depositTerms: "One month deposit (KES 9,000)", area: "Karen", distances: { KSL: { walkMin: 5 }, JKUAT: { walkMin: 12 }, Tangaza: { matatuMin: 12 }, CUEA: { matatuMin: 15 }, "Co-op": { matatuMin: 25 } }, matatuFareKes: 40, amenities: ["Water 24/7", "WiFi", "Gated Security", "Tokens"], status: "Taken", caretakerId: "c1", confirmedDaysAgo: 2, photoStart: 3 },
];
const toKe = (n) => `+254${n.replace(/\D/g, "").replace(/^0/, "")}`;
/** Hostel "caretakers" are the hostel's own contact, unverified until an admin approves them. */
const hostelCaretakers = hostelSeeds.map((h) => ({ id: `hc-${h.id}`, name: h.title, phone: toKe(h.phone), verified: false, trustScore: 50, joinedAt: daysAgo(30) }));
caretakers.push(...hostelCaretakers);
const hostelRooms = hostelSeeds.map((h, i) => ({
    id: h.id,
    title: h.title,
    description: `${h.gender === "Mixed" ? "Ladies and gents" : h.gender ?? "Student"} hostel${h.capacity ? ` with ${h.capacity} beds` : ""}. ${h.notes ?? ""}`.trim(),
    roomType: "hostel",
    rentKes: cheapestMonthly(h.options),
    depositTerms: h.deposit ?? (h.regFee ? `KES ${h.regFee.toLocaleString("en-KE")} non-refundable fee` : "Ask the hostel"),
    area: h.km === 6 ? "Rongai" : "Karen",
    distances: {},
    distanceLabel: h.km != null ? `${h.km < 1 ? h.km * 1000 + " m" : h.km + " km"} to JKUAT Karen` : h.distance,
    matatuFareKes: 0,
    amenities: [],
    status: "Vacant",
    caretakerId: `hc-${h.id}`,
    gender: h.gender,
    meals: h.meals,
    transport: h.transport,
    roomOptions: h.options,
    registrationFeeKes: h.regFee,
    jkuatListed: true,
    notes: h.notes,
    photos: photos(i),
    mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.title + ", Karen, Nairobi")}`,
    whatsappNumber: toKe(h.phone),
    callNumber: toKe(h.phone),
    lastConfirmedVacantAt: daysAgo(20),
    createdAt: daysAgo(30),
}));
export const rooms = [...seeds.map(({ confirmedDaysAgo, photoStart, ...s }) => {
    const ct = caretakers.find((c) => c.id === s.caretakerId);
    return {
        ...s,
        photos: photos(photoStart),
        mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.area + ", Nairobi")}`,
        whatsappNumber: ct.phone,
        callNumber: ct.phone,
        lastConfirmedVacantAt: daysAgo(confirmedDaysAgo),
        createdAt: daysAgo(confirmedDaysAgo + 10),
    };
}), ...hostelRooms];
export const accounts = [
    { id: "u1", name: "Amina Student", phone: "+254711111111", role: "student", phoneVerified: true, password: "password123" },
    { id: "c1", name: "Mama Wanjiru", phone: "+254712345678", role: "caretaker", phoneVerified: true, password: "password123" },
    { id: "c2", name: "John Otieno", phone: "+254722111222", role: "caretaker", phoneVerified: true, password: "password123" },
    { id: "a1", name: "Rommie Admin", phone: "+254700000000", role: "admin", phoneVerified: true, password: "password123" },
];
/** A plain monochrome stand-in for an uploaded ID, so the admin viewer has something to show. */
function docPlaceholder(title, name) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="#f7f7f7"/><rect x="24" y="24" width="592" height="352" rx="12" fill="#fff" stroke="#ebebeb"/><rect x="48" y="56" width="96" height="120" rx="8" fill="#dddddd"/><text x="168" y="84" font-family="sans-serif" font-size="20" font-weight="600" fill="#222">${title}</text><text x="168" y="124" font-family="sans-serif" font-size="16" fill="#6a6a6a">${name}</text><rect x="168" y="146" width="280" height="10" rx="5" fill="#ebebeb"/><rect x="168" y="168" width="200" height="10" rx="5" fill="#ebebeb"/><rect x="48" y="220" width="544" height="10" rx="5" fill="#ebebeb"/><rect x="48" y="244" width="480" height="10" rx="5" fill="#ebebeb"/><rect x="48" y="268" width="520" height="10" rx="5" fill="#ebebeb"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
/** Documents waiting in the admin queue on first load. */
export const seedVerificationRequests = [
    { id: "v1", kind: "student", userId: "seed-s1", name: "Brian Mwangi", phone: "+254722555666", documentUrl: docPlaceholder("Student ID card", "Brian Mwangi"), documentName: "student-id.png", documentMime: "image/png", submittedAt: daysAgo(1), status: "pending" },
    { id: "v2", kind: "student", userId: "seed-s2", name: "Faith Chebet", phone: "+254733777888", documentUrl: docPlaceholder("Admission letter", "Faith Chebet"), documentName: "admission-letter.png", documentMime: "image/png", submittedAt: daysAgo(2), status: "pending" },
    { id: "v3", kind: "caretaker", userId: "c3", name: "Grace Muthoni", phone: "+254733444555", documentUrl: docPlaceholder("National ID", "Grace Muthoni"), documentName: "national-id.png", documentMime: "image/png", submittedAt: daysAgo(3), status: "pending" },
    { id: "v4", kind: "caretaker", userId: "c5", name: "Ann Njeri", phone: "+254700123123", documentUrl: docPlaceholder("National ID", "Ann Njeri"), documentName: "national-id.png", documentMime: "image/png", submittedAt: daysAgo(1), status: "pending" },
];
/** Open reports on first load, so the admin dashboard has something to count. */
export const seedReports = [
    { id: "rep1", roomId: "r5", reason: "Already taken", createdAt: daysAgo(2) },
    { id: "rep2", roomId: "r12", reason: "Wrong price", note: "Caretaker quoted a higher rent on the phone.", createdAt: daysAgo(4) },
];

/**
 * Private hostels in the Karen area, transcribed from the Karen Campus Dean of Students "Private Hostels Guide 2025".
 * The guide serves students of all the nearby schools, not one campus. Where it names a campus we keep it in `nearCampus`;
 * otherwise the distance is simply "to campus" as printed.
 * Prices and contacts are as printed there. Confirm with the hostel before paying: terms change each semester.
 * Not yet entered: Blue Plantinum's Homes (prices unclear on the scan) and Qejani's "superior double" rate.
 */
const m = (label, rentKes, maxKes) => ({ label, rentKes, ...(maxKes ? { maxKes } : {}), billing: "month" });
const sem = (label, rentKes, maxKes) => ({ label, rentKes, ...(maxKes ? { maxKes } : {}), billing: "semester" });

export const hostelSeeds = [
    { id: "h1", title: "Elite Hostel", gender: "Mixed", capacity: 189, phone: "0707213055", km: 10, transport: true, meals: "available", options: [m("Single", 15000, 16500), m("Sharing", 12500, 14500)], notes: "Half board available." },
    { id: "h2", title: "Mirvins Hostel", gender: "Mixed", capacity: 50, phone: "0723713732", km: 2.5, transport: true, meals: "available", options: [sem("Room", 59000)], regFee: 3000, notes: "Half board available; lunch offered on weekends and public holidays." },
    { id: "h3", title: "Karen Gardens", gender: "Ladies", capacity: 95, phone: "0724049619", km: 1.2, transport: true, meals: "available", options: [sem("Room", 55000, 75000)], regFee: 3000, notes: "Half board available." },
    { id: "h4", title: "Chege's Place", gender: "Mixed", capacity: 3, phone: "0712543126", distance: "At the junction of Kuro and Kongoni Road", transport: false, meals: "none", options: [m("Room", 10000)], deposit: "One month deposit", notes: "Ladies or gents. Only 3 spaces." },
    { id: "h5", title: "Bogani East Apartments (Wanyoike's)", gender: "Mixed", capacity: 133, phone: "0721709759", km: 1.5, transport: false, meals: "none", options: [m("Option A", 11500), m("Option B", 12600), m("Option C", 15000)], notes: "Three price tiers as listed in the guide; ask which room each covers." },
    { id: "h6", title: "Starehe Hostel", gender: "Mixed", capacity: 133, phone: "0722474849", km: 1.5, transport: false, meals: "none", options: [m("Room", 12000, 17000)] },
    { id: "h7", title: "Gardenia Men's Hostel", gender: "Gents", capacity: 50, phone: "0723411334", km: 1.5, transport: true, meals: "available", options: [sem("Room", 64000)], regFee: 3000, notes: "Kasuku Close. The KES 3,000 is non-refundable caution money. Meals offered." },
    { id: "h8", title: "Lale Hostel", gender: "Mixed", capacity: 75, phone: "0722853679", km: 3, transport: true, meals: "available", options: [sem("Room", 57000)] },
    { id: "h9", title: "Banaki Hostel", gender: "Ladies", capacity: 48, phone: "0720773363", km: 2, transport: true, meals: "available", options: [m("Monthly", 13000), sem("Per semester", 52000)] },
    { id: "h10", title: "Campus Lane", gender: "Ladies", capacity: 50, phone: "0722527293", km: 1, transport: true, meals: "available", options: [sem("Per semester", 52000), m("Monthly", 12000, 20000)] },
    { id: "h11", title: "Stanjo Hostels", gender: "Mixed", capacity: 50, phone: "0711308207", km: 0.8, transport: false, meals: "none", options: [m("Standard", 15000), m("Mid", 20000), m("Premium", 25000)] },
    { id: "h12", title: "St. Francis Ladies Hostel", gender: "Ladies", capacity: 80, phone: "0712739345", distance: "Near the JKUAT Karen campus gate", nearCampus: "JKUAT", transport: false, meals: "none", options: [m("Single (ensuite)", 15000, 19000), sem("Single, per semester", 60000, 75000), m("Sharing (ensuite)", 10000, 12500), sem("Sharing, per semester", 40000, 50000)] },
    { id: "h13", title: "Buon Villa Hostels", gender: "Mixed", capacity: 88, phone: "0722703464", distance: "500 m walk from Co-operative University", nearCampus: "Co-op", transport: false, meals: "available", options: [m("4 sharing", 10000), m("3 sharing", 10500)], notes: "Electricity not included in the rent." },
    { id: "h14", title: "Qejani Student Residences", gender: "Mixed", capacity: 800, phone: "0800733533", km: 0.8, transport: false, meals: "none", options: [m("Quadruple", 12500), m("Double", 15500)], notes: "No meals: cook for yourself or buy from their cafeteria. Superior double rate to be confirmed." },
    { id: "h15", title: "Charles Heery Hostels", capacity: 120, phone: "0757527814", km: 0.2, transport: false, meals: "none", options: [m("Single", 12000), m("Sharing", 14500), m("Executive", 19500)] },
    { id: "h16", title: "Timpheys Hostel", gender: "Mixed", capacity: 75, phone: "0769733329", distance: "6 km, Rongai", transport: false, meals: "available", options: [m("4-6 sharing", 5000)] },
];

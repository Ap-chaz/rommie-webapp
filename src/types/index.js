/**
 * Shared domain types, written as JSDoc typedefs so editors give autocomplete without TypeScript.
 * Reference one from any file with  {import("@/types").Room}  inside a JSDoc comment.
 */

/** @typedef {"Gataka" | "Rongai" | "Maasai Lodge" | "Karen"} Area */
/** @typedef {"bedsitter" | "single_room" | "one_bedroom" | "hostel"} RoomType */
/** @typedef {"Ladies" | "Gents" | "Mixed"} Gender  "Mixed" means both ladies and gents are accepted. */
/** @typedef {"none" | "available"} Meals */
/** @typedef {"month" | "semester"} Billing */
/** @typedef {"Vacant" | "Taken"} RoomStatus */
/** @typedef {"KSL" | "JKUAT" | "Tangaza" | "CUEA" | "Co-op"} Campus */
/** @typedef {"Water 24/7" | "WiFi" | "Tokens" | "Gated Security"} Amenity */

/**
 * @typedef {object} CampusDistance
 * @property {number} [walkMin]
 * @property {number} [matatuMin]
 */

/**
 * One bookable choice inside a hostel (single, 4 sharing, ensuite...). A normal rental has none.
 * @typedef {object} RoomOption
 * @property {string} label            e.g. "Single (ensuite)" or "4 sharing"
 * @property {number} rentKes          Price, or the low end of a price range.
 * @property {number} [maxKes]         High end when the hostel quotes a range.
 * @property {Billing} billing         Hostels quote per month or per semester (about 4 months).
 * @property {string[]} [photos]       Photos of this room type, so students can tell a single from an executive room.
 */

/**
 * @typedef {object} Room
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {RoomType} roomType
 * @property {number} rentKes
 * @property {string} depositTerms
 * @property {Area} area
 * @property {Record<Campus, CampusDistance>} distances
 * @property {number} matatuFareKes
 * @property {Amenity[]} amenities
 * @property {string[]} photos
 * @property {string} mapLink
 * @property {RoomStatus} status
 * @property {string} lastConfirmedVacantAt  ISO date
 * @property {string} whatsappNumber
 * @property {string} callNumber
 * @property {string} caretakerId
 * @property {string} createdAt  ISO date
 * @property {Gender} [gender]               Hostels only. Leave empty for open rentals.
 * @property {Meals} [meals]                 Hostels only.
 * @property {boolean} [transport]           Hostels only: the hostel runs transport to campus.
 * @property {string} [distanceLabel]        Hostels only, e.g. "2.5 km to campus".
 * @property {RoomOption[]} [roomOptions]    Hostels only. rentKes is the cheapest option as a monthly figure.
 * @property {number} [registrationFeeKes]   One-off non-refundable fee some hostels charge.
 * @property {boolean} [inGuide]              Appears in the Karen Campus Dean of Students private hostels guide (2025), which covers all nearby schools.
 * @property {Campus} [nearCampus]           The campus the guide names for this hostel, when it names one.
 * @property {string} [notes]                Extra terms, e.g. "Electricity not included".
 * @property {string} [buildingId]   Shared by listings posted for different room types in the same building.
 * @property {boolean} [hidden]  Set by an admin to take a stale or reported listing off the public site.
 */

/**
 * @typedef {object} Caretaker
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 * @property {boolean} verified
 * @property {number} trustScore
 * @property {string} joinedAt
 */

/** @typedef {Room & { caretaker: Caretaker }} RoomWithCaretaker */

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 * @property {"student" | "caretaker" | "admin"} role
 * @property {boolean} phoneVerified
 * @property {string} email
 * @property {boolean} [studentVerified]
 */

/**
 * @typedef {object} SavedRoom
 * @property {string} userId
 * @property {string} roomId
 * @property {string} savedAt
 */

/**
 * @typedef {object} VacancyAlert
 * @property {string} id
 * @property {Area} [area]
 * @property {number} [maxRentKes]
 * @property {RoomType} [roomType]
 * @property {boolean} active
 * @property {string} createdAt
 */

/** @typedef {"Fake listing" | "Already taken" | "Wrong price" | "Wrong photos" | "Other"} ReportReason */
/** @typedef {"open" | "resolved" | "dismissed"} ReportStatus */

/**
 * One entry in the admin activity log.
 * @typedef {object} ActivityEntry
 * @property {string} id
 * @property {string} at  ISO date
 * @property {string} actorId
 * @property {string} actor
 * @property {string} action  e.g. "listing.hidden", "report.dismissed"
 * @property {string} summary  One readable sentence.
 * @property {object} [target]
 */

/**
 * @typedef {object} Report
 * @property {string} id
 * @property {string} roomId
 * @property {ReportReason} reason
 * @property {string} [note]
 * @property {ReportStatus} [status]  Missing means "open".
 * @property {"hidden" | "resolved" | "dismissed" | "deleted"} [action]
 * @property {string} [handledAt]
 * @property {string} [handledBy]
 * @property {string} createdAt
 */

/**
 * @typedef {object} VerificationRequest
 * @property {string} id
 * @property {"student" | "caretaker"} kind
 * @property {string} name
 * @property {string} phone
 * @property {string} documentUrl
 * @property {string} submittedAt
 * @property {"pending" | "approved" | "rejected"} status
 * @property {string} [reason]
 * @property {string} [userId]  The account that submitted it, so approvals can update that account's badge.
 * @property {string} [documentName]
 * @property {string} [documentMime]
 */

/** @typedef {VerificationRequest["kind"]} VerificationKind */

/**
 * A person's own verification state for one kind of document.
 * @typedef {object} VerificationState
 * @property {"none" | VerificationRequest["status"]} status
 * @property {VerificationRequest} [request]
 */

/**
 * @typedef {object} TrustItem
 * @property {"verification" | "freshness" | "reports" | "age"} key
 * @property {string} label
 * @property {number} points
 * @property {number} max
 * @property {string} note
 */

/**
 * @typedef {object} TrustScore
 * @property {number} score
 * @property {TrustItem[]} items
 */

/**
 * @typedef {object} CaretakerProfile
 * @property {Caretaker} caretaker
 * @property {Room[]} rooms
 * @property {TrustScore} trust
 * @property {VerificationState} verification
 */

/**
 * @typedef {object} AdminStats
 * @property {number} totalListings
 * @property {number} vacancies
 * @property {number} contactsMade
 * @property {number} staleListings
 * @property {number} openReports
 * @property {number} hiddenListings
 * @property {number} contactsMade  WhatsApp and Call taps on listings that still exist.
 * @property {RoomWithCaretaker[]} stale
 */

/**
 * @typedef {object} RoomFilters
 * @property {Area} [area]
 * @property {number} [minRent]
 * @property {number} [maxRent]
 * @property {RoomType} [roomType]
 * @property {Campus} [near]
 * @property {Amenity[]} [amenities]
 * @property {Gender} [gender]
 * @property {boolean} [mealsOnly]
 * @property {boolean} [transportOnly]
 * @property {boolean} [vacantOnly]
 * @property {"newest" | "rent_asc" | "rent_desc"} [sort]
 */

export {};

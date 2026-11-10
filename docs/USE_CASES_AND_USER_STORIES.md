# Use Cases and User Stories Specification

## Document Metadata

| Attribute | Details |
| :--- | :--- |
| **Document ID** | `DOC-UCUS-001` |
| **Version** | 1.1 |
| **Status** | Draft (Pending Owner Approval) |
| **Author** | Antigravity AI Agent (Senior Systems Analyst & Backend Technical Lead) |
| **Created** | 2026-10-19 |
| **Target Application** | Rommie — Student Accommodation Web Platform (Karen/Rongai, Kenya) |
| **Primary Repository** | `e:\Coding_Projects\rommie-webapp` |
| **Traceability Documents** | [house_hunting_web_app_nfrs.md](file:///e:/Coding_Projects/rommie-webapp/house_hunting_web_app_nfrs.md), [SYSTEM_ARCHITECTURE.md](file:///e:/Coding_Projects/rommie-webapp/docs/SYSTEM_ARCHITECTURE.md), and [AGENTS.md](file:///e:/Coding_Projects/rommie-webapp/AGENTS.md) Section 7 |

---

## Change History

| Version | Date | Author | Summary of Changes |
| :--- | :--- | :--- | :--- |
| 1.1 | 2026-11-06 | Antigravity AI Agent | Design Review v1.1 Updates (Alvan's Review):<br/>1. Transitioned OTP verification and vacancy alerts from SMS Gateway to Transactional Email Service (Brevo/Postmark/AWS SES) with per-email and per-IP rate limiting; Google OAuth accounts bypass verification; User entity updated from phoneVerified to emailVerified.<br/>2. Retired Student ID verification (UC-009, US-009 marked RETIRED/REMOVED; UC-028/US-028 updated to Caretaker-only KYC queue; UI routes and badges removed).<br/>3. Caretaker listing photo requirements updated to exactly 10 photos with specified shot breakdown, no pre-compression file size limit, and no limit on total listings per caretaker. |
| 1.0 | 2026-10-19 | Antigravity AI Agent | Initial baseline release detailing 35 end-to-end Use Cases (UC-001 to UC-035), 35 User Stories (US-001 to US-035) with Given/When/Then acceptance criteria, Mermaid use case boundaries, and cross-tier traceability to FR, NFR, API, Entity, and Vitest test suites. |

---

## Executive Summary & Scope

Rommie is a hyper-localized student accommodation discovery platform designed specifically for tertiary students attending universities in the Karen and Rongai peri-urban corridors of Nairobi and Kajiado counties, Kenya:
1. **Kenya School of Law (KSL)** (Karen)
2. **JKUAT Karen Campus** (Bogani Road)
3. **Tangaza University** (Karen)
4. **Catholic University of Eastern Africa (CUEA)** (Bogani East Road)
5. **Co-operative University of Kenya** (Ushirika Road, Karen)

The primary residential settlement zones covered by Rommie include **Gataka**, **Ongata Rongai**, **Maasai Lodge**, and **Karen Central**.

This document establishes the authoritative functional specification through **35 Use Cases** and **35 User Stories**. Every use case and story is grounded in concrete repository evidence extracted from the frontend implementation ([src/routes.jsx](file:///e:/Coding_Projects/rommie-webapp/src/routes.jsx), [src/services/api.js](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js), [src/types/index.js](file:///e:/Coding_Projects/rommie-webapp/src/types/index.js), and individual page components).

### Requirement Status Classification
- **Confirmed**: Explicitly implemented in the UI, client service layer, and Vitest test suites.
- **Inferred**: Derived logically from existing user journeys, error handling, or validation constraints.
- **Proposed**: Architectural or functional enhancements required for backend production readiness.
- **Needs Decision**: Explicit trade-offs or configuration choices requiring project owner approval.

---

## 1. System Actors & Stakeholder Hierarchy

```
+----------------------------------------------------------------------------------------------------+
|                                    ACTOR TAXONOMY & ACCESS MATRIX                                  |
+-------------------+---------------+-----------------------+----------------------------------------+
| Actor Name        | Actor Type    | System Role           | Primary Capabilities & Objectives      |
+-------------------+---------------+-----------------------+----------------------------------------+
| Student           | Human (End)   | `student`             | Browse/filter listings, inspect rooms, |
|                   |               | (or Visitor / Guest)  | contact caretakers via WhatsApp/phone, |
|                   |               |                       | save favorites, set email vacancy alerts,|
|                   |               |                       | report bad listings                    |
+-------------------+---------------+-----------------------+----------------------------------------+
| Caretaker         | Human (End)   | `caretaker`           | Register accommodation, post & edit 20+|
|                   |               |                       | property attributes, upload photos,    |
|                   |               |                       | toggle vacancy status, reconfirm stale |
|                   |               |                       | listings, clone building room types,   |
|                   |               |                       | submit National ID, track trust score  |
+-------------------+---------------+-----------------------+----------------------------------------+
| Administrator     | Human (Ops)   | `admin`               | Platform governance, view 6 dashboard  |
|                   |               |                       | KPI metrics, hide/restore listings,    |
|                   |               |                       | review abuse reports, suspend users,   |
|                   |               |                       | review ID verification queue, inspect  |
|                   |               |                       | audit logs & platform analytics        |
+-------------------+---------------+-----------------------+----------------------------------------+
| Google OAuth      | External      | Identity Provider     | Federated authentication via OIDC      |
| Provider          | Service       | (IdP)                 | ID tokens (simulated in mock client)   |
+-------------------+---------------+-----------------------+----------------------------------------+
| Email Service     | External      | Transactional Email    | Outbound delivery of 6-digit OTP codes |
| Provider          | Service       | Service                | and matching vacancy alert emails      |
+-------------------+---------------+-----------------------+----------------------------------------+
| Maps Provider     | External      | Geospatial Service    | Direct outbound deep linking to Google |
|                   | Service       |                       | Maps search coordinates/queries        |
+-------------------+---------------+-----------------------+----------------------------------------+
```

---

## 2. Mermaid Use Case Diagram

The following diagram defines the operational boundaries and interactions between human actors, external services, and the Rommie platform use cases:

```mermaid
flowchart TB
    subgraph Actors ["Primary & External Actors"]
        StudentActor["Student / Visitor"]
        CaretakerActor["Caretaker / Landlord"]
        AdminActor["Platform Administrator"]
        GoogleActor["Google OAuth Provider"]
        EmailActor["Email Service Provider (Brevo/SES)"]
        MapsActor["Google Maps Platform"]
    end

    subgraph RommieApp ["Rommie Accommodation Platform"]
        subgraph StudentDomain ["Student Capabilities"]
            UC001["UC-001: Browse & Search Rooms"]
            UC002["UC-002: View Room Details"]
            UC003["UC-003: Contact Caretaker"]
            UC004["UC-004: Save/Unsave Rooms"]
            UC005["UC-005: Manage Vacancy Alerts"]
            UC006["UC-006: Register Student Account"]
            UC007["UC-007: Log In"]
            UC008["UC-008: Verify Email via OTP"]
            UC009["UC-009: [RETIRED] Student ID Verification"]
            UC010["UC-010: Report a Listing"]
            UC011["UC-011: View Campus Zones"]
        end

        subgraph CaretakerDomain ["Caretaker Capabilities"]
            UC012["UC-012: Register Caretaker Account"]
            UC013["UC-013: Log In as Caretaker"]
            UC014["UC-014: Post Room Listing (10 Photos)"]
            UC015["UC-015: Edit Own Listing"]
            UC016["UC-016: Toggle Room Vacancy Status"]
            UC017["UC-017: Reconfirm Stale/Hidden Listing"]
            UC018["UC-018: Delete Own Listing"]
            UC019["UC-019: Add Another Room Type to Building"]
            UC020["UC-020: Submit Caretaker ID Verification"]
            UC021["UC-021: View Trust Score Breakdown"]
        end

        subgraph AdminDomain ["Admin Moderation Capabilities"]
            UC022["UC-022: View Platform Dashboard"]
            UC023["UC-023: Hide Stale Listings"]
            UC024["UC-024: Restore Hidden Listings"]
            UC025["UC-025: Manage All Listings"]
            UC026["UC-026: Review User Reports"]
            UC027["UC-027: Manage Users"]
            UC028["UC-028: Review Verification Queue (Caretaker KYC)"]
            UC029["UC-029: Undo Verification Decision"]
            UC030["UC-030: View Admin Activity Log"]
            UC031["UC-031: View Platform Analytics"]
            UC032["UC-032: Update Site Settings"]
        end

        subgraph SystemDomain ["System & Client Capabilities"]
            UC033["UC-033: Cross-Tab Session Sync"]
            UC034["UC-034: Offline Detection"]
            UC035["UC-035: Client-Side Image Compression"]
        end
    end

    %% Student Relationships
    StudentActor --> UC001
    StudentActor --> UC002
    StudentActor --> UC003
    StudentActor --> UC004
    StudentActor --> UC005
    StudentActor --> UC006
    StudentActor --> UC007
    StudentActor --> UC008
    %% UC009 Retired: Student ID verification removed per design review
    StudentActor --> UC010
    StudentActor --> UC011

    %% Caretaker Relationships
    CaretakerActor --> UC012
    CaretakerActor --> UC013
    CaretakerActor --> UC014
    CaretakerActor --> UC015
    CaretakerActor --> UC016
    CaretakerActor --> UC017
    CaretakerActor --> UC018
    CaretakerActor --> UC019
    CaretakerActor --> UC020
    CaretakerActor --> UC021

    %% Admin Relationships
    AdminActor --> UC022
    AdminActor --> UC023
    AdminActor --> UC024
    AdminActor --> UC025
    AdminActor --> UC026
    AdminActor --> UC027
    AdminActor --> UC028
    AdminActor --> UC029
    AdminActor --> UC030
    AdminActor --> UC031
    AdminActor --> UC032

    %% External System Integrations
    UC006 -.-> GoogleActor
    UC007 -.-> GoogleActor
    UC012 -.-> GoogleActor
    UC013 -.-> GoogleActor
    UC008 -.-> SmsActor
    UC005 -.-> SmsActor
    UC002 -.-> MapsActor

    %% Internal Includes / Extends
    UC014 ..> UC035 : "<<include>>"
    UC019 ..> UC035 : "<<include>>"
    UC007 ..> UC033 : "<<include>>"
```

---

## 3. Detailed Use Case Specifications

---

### 3.1 Student Use Cases (UC-001 to UC-011)

#### UC-001: Browse and Search Rooms
- **Primary Actor**: Student (or Anonymous Visitor).
- **Supporting Actors**: None.
- **Goal**: Find vacant accommodations matching specific criteria across budget, location, amenities, and campus proximity.
- **Trigger**: User navigates to `/rooms` or submits search parameters from the header capsule.
- **Preconditions**: Web application is loaded in browser.
- **Postconditions**: URL search string updates with serialized filter state (`?area=...&maxRent=...`); filtered list of room cards renders; vacant rooms prioritized.
- **Main Success Flow**:
  1. User accesses `/rooms`.
  2. System reads URL parameters via [`useSearch(validateSearch)`](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomsPage.jsx#L17-L29).
  3. System calls [`getRooms(filters)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L135-L173).
  4. System filters out listings where `hidden === true` or where the owning caretaker is suspended via `isSuspended(r.caretakerId)`.
  5. System evaluates criteria: `area`, `roomType`, `minRent`, `maxRent`, `gender`, `mealsOnly`, `transportOnly`, `vacantOnly`, `amenities`, and `near` (campus walk/matatu <= 20 mins or guide hostel match).
  6. System sorts matching rooms: vacant listings first, then ordered by selected sort (`newest` confirmed date, `rent_asc`, or `rent_desc`).
  7. System renders responsive room cards with cover photo, rent, area, distance chip, confirmation badge, and trust indicators.
- **Alternative Flows**:
  - *3a. User adjusts filters on desktop sidebar or mobile bottom sheet*:
    1. User modifies a filter chip (e.g., toggles "WiFi" or changes Area to "Rongai").
    2. System updates URL query state using `replace: true`.
    3. React Query detects key change `["rooms", filters]` and updates listing view with `keepPreviousData`.
  - *6a. Zero matching listings found*:
    1. System displays empty state: *"No rooms match yet."*
    2. System presents action button *"Create a vacancy alert"* which pre-fills alert form with current search criteria, and *"Clear filters"* button.
- **Exceptions**:
  - *E1. Network or service error*: System displays error card *"Couldn't load rooms"* with a *"Retry"* button.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-003 (Caretaker)`.
  - *Written*: Client browser URL query string.
- **Security/Authorization**: Publicly accessible. Excludes quarantined (`hidden`) or suspended caretaker listings.
- **Related IDs**: `FR-001`, `NFR-PERF-001`, `NFR-USA-001`, `API-001`, `ENT-001`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/RoomsPage.jsx#L17-L147](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomsPage.jsx#L17-L147), [src/services/api.js#L135-L173](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L135-L173).

---

#### UC-002: View Room Details
- **Primary Actor**: Student (or Anonymous Visitor).
- **Supporting Actors**: Maps Provider (external).
- **Goal**: Review exhaustive property attributes, inspect high-resolution photographs, check commute times, and verify caretaker trust score before making contact.
- **Trigger**: User clicks a room card from `/rooms`, `/saved`, or `/zones`.
- **Preconditions**: Target room ID exists in data store.
- **Postconditions**: Room details, photos, caretaker trust score, and building sibling listings are rendered.
- **Main Success Flow**:
  1. User navigates to `/rooms/:id`.
  2. System invokes [`getRoom(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L174-L178).
  3. System validates that the listing is neither hidden nor belonging to a suspended caretaker.
  4. System fetches caretaker trust score and resolves verification status via [`computeTrust`](file:///e:/Coding_Projects/rommie-webapp/src/lib/trust.js#L9-L48).
  5. System triggers background query [`getBuildingRooms(room.buildingId, room.id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L254-L257) if `buildingId` is defined.
  6. System renders layout:
     - Desktop 5-photo grid or mobile swipe carousel with snap scrolling.
     - Title, area, room type label, and vacancy confirmation badge.
     - Pricing breakdown: monthly rent, deposit terms, and hostel room options (if applicable).
     - Commute distance breakdown: walking and matatu minutes per campus (KSL, JKUAT, Tangaza, CUEA, Co-op), and estimated matatu fare in KES.
     - External Google Maps link (`mapLink`).
     - Included amenities list.
     - Caretaker trust card showing score (0-100) and verified badge.
     - Other room types available in the same building.
     - Safety disclaimer: *"Never pay before viewing. Visit with a friend and confirm the caretaker's identity."*
  7. User clicks a photo to open the interactive full-screen Lightbox with thumbnail navigation and keyboard/swipe controls.
- **Alternative Flows**:
  - *2a. Listing belongs to a hostel*:
    1. System renders hostel-specific option table (e.g., "Single ensuite", "4 sharing") with option-specific photos and prices.
    2. System displays registration fee notice and Dean of Students Guide badge if `inGuide === true`.
- **Exceptions**:
  - *E1. Room ID does not exist, is hidden, or caretaker is suspended*:
    1. System renders *"Room not found"* state with a button to *"Browse rooms"*.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-003 (Caretaker)`, `ENT-011 (Building)`.
  - *Written*: None.
- **Security/Authorization**: Public access. Quarantined or suspended properties are blocked with 404 behavior.
- **Related IDs**: `FR-002`, `NFR-PERF-003`, `NFR-USA-002`, `API-002`, `ENT-001`, `ENT-003`, `TC-HST-001`.
- **UI Evidence Paths**: [src/pages/RoomDetailPage.jsx#L1-L292](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomDetailPage.jsx#L1-L292), [src/services/api.js#L174-L178](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L174-L178).

---

#### UC-003: Contact Caretaker
- **Primary Actor**: Student (or Anonymous Visitor).
- **Supporting Actors**: WhatsApp Application / Native Dialer.
- **Goal**: Contact property caretaker directly to arrange a viewing while Rommie tracks student interest.
- **Trigger**: User taps *"WhatsApp"* or *"Call"* action button on room details or room card.
- **Preconditions**: Room details are displayed on screen; caretaker contact numbers are present.
- **Postconditions**: Native WhatsApp chat or dialer opens; system records contact event if outside 30s deduplication window.
- **Main Success Flow**:
  1. Student taps *"WhatsApp"* or *"Call"* on a room listing.
  2. System triggers fire-and-forget telemetry via [`trackContact(roomId, channel)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L59-L77).
  3. System evaluates tracking guards:
     - Ignores if user is signed in as `admin`.
     - Ignores if user is signed in as the listing's own caretaker (`u.id === room.caretakerId`).
     - Ignores if identical contact on same room and channel occurred within the last 30,000ms (`CONTACT_DEDUPE_MS = 30000`).
  4. If guards pass, system appends record `{ id, roomId, channel, at, userId? }` to `rommie.contacts` (capped at 2,000 entries).
  5. For WhatsApp: browser opens deep link `https://wa.me/<number>?text=<encoded_inquiry>`.
  6. For Call: browser invokes native `tel:<callNumber>`.
- **Alternative Flows**:
  - *3a. Duplicate tap within 30 seconds*: System permits external deep link launch immediately but suppresses secondary counter increment.
- **Exceptions**:
  - *E1. Tracking fails or localStorage full*: Catch-block swallows error silently so student contact is never hindered.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-002 (User session)`.
  - *Written*: `ENT-008 (ContactEvent)`.
- **Security/Authorization**: Open to all users. Caretakers and admins excluded from metrics inflation.
- **Related IDs**: `FR-003`, `NFR-INT-003`, `API-003`, `ENT-008`, `TC-CON-001`, `TC-CON-002`, `TC-CON-003`, `TC-CON-004`.
- **UI Evidence Paths**: [src/services/api.js#L59-L77](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L59-L77), [src/pages/RoomDetailPage.jsx#L264-L265](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomDetailPage.jsx#L264-L265), [src/test/contacts.test.js#L1-L60](file:///e:/Coding_Projects/rommie-webapp/src/test/contacts.test.js#L1-L60).

---

#### UC-004: Save/Unsave Rooms
- **Primary Actor**: Student.
- **Supporting Actors**: None.
- **Goal**: Maintain a personal shortlist of preferred rooms for quick comparison.
- **Trigger**: Student clicks Heart icon on Room Card or Save button on Room Details page.
- **Preconditions**: User must be authenticated with role `student`.
- **Postconditions**: Room ID added or removed from student's saved list; UI updates optimistically with toast feedback.
- **Main Success Flow**:
  1. Student taps Heart icon on a listing.
  2. [`useSaved()`](file:///e:/Coding_Projects/rommie-webapp/src/lib/saved.js#L9-L48) checks user authentication.
  3. User is signed in as `student`.
  4. System executes optimistic update: immediately alters cached query data `["saved-ids", userId]` and flips heart visual state.
  5. System sends asynchronous request [`saveRoom(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L187-L193) or [`unsaveRoom(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L194-L198).
  6. Toast notification confirms: *"Saved to your rooms"* or *"Removed from saved rooms"*.
  7. Student navigates to `/saved` to view full grid of saved listings.
- **Alternative Flows**:
  - *2a. Unauthenticated visitor taps Save*:
    1. System invokes [`useAuthGate`](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L39-L49).
    2. Displays toast: *"Log in to save rooms."*
    3. Redirects visitor to `/login?redirect=/current/page`.
  - *2b. Signed in caretaker or admin taps Save*:
    1. System blocks action and displays toast: *"Saving rooms is for student accounts."*
- **Exceptions**:
  - *E1. Network call fails*: Optimistic state rolls back to previous cache snapshot; error toast displays: *"Couldn't update your saved rooms. Try again."*
- **Data Read/Written**:
  - *Read*: `ENT-004 (SavedRoom)`, `ENT-001 (Room)`.
  - *Written*: `ENT-004 (SavedRoom)`.
- **Security/Authorization**: Restricted to `role === "student"`.
- **Related IDs**: `FR-004`, `NFR-USA-001`, `API-004`, `ENT-004`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/lib/saved.js#L1-L49](file:///e:/Coding_Projects/rommie-webapp/src/lib/saved.js#L1-L49), [src/pages/SavedPage.jsx#L1-L41](file:///e:/Coding_Projects/rommie-webapp/src/pages/SavedPage.jsx#L1-L41), [src/services/api.js#L179-L208](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L179-L208).

---

#### UC-005: Manage Vacancy Alerts
- **Primary Actor**: Student.
- **Supporting Actors**: Email Service Provider (external).
- **Goal**: Subscribe to automated email and in-app notifications when a matching room becomes vacant, and manage existing subscriptions.
- **Trigger**: Student navigates to `/alerts` or clicks *"Create a vacancy alert"* from empty search results.
- **Preconditions**: Authenticated user with role `student` and a verified email address (`emailVerified: true`).
- **Postconditions**: New `VacancyAlert` persisted; system triggers email & in-app alert delivery when matching listing is marked vacant.
- **Main Success Flow**:
  1. Student accesses `/alerts`.
  2. System verifies `RequireRole(["student"])`.
  3. Student specifies search parameters: Area (e.g., "Gataka"), Max Rent in KES (e.g., 7,500), and Room Type (e.g., "bedsitter").
  4. System dynamically generates live summary: *"You'll get an email alert for: Bedsitter in Gataka under KES 7,500/month."*
  5. Student submits form.
  6. System validates criteria, assigns UUID, marks `active: true`, and invokes [`createAlert(data)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L211-L217).
  7. Toast confirms: *"Alert created. We'll email you when a match opens."*
  8. Alert appears in "Your alerts" list with creation timestamp and matching room links.
- **Alternative Flows**:
  - *3a. Student toggles alert active status*:
    1. Student toggles Switch on an existing alert card.
    2. Optimistic update fires; system calls [`updateAlert(id, { active })`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L223-L227).
    3. Status pill toggles between "On" and "Paused".
  - *3b. Student deletes an alert*:
    1. Student clicks Trash button on an alert card.
    2. System calls [`deleteAlert(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L228-L232); card removes with toast notification *"Alert deleted"*.
- **Exceptions**:
  - *E1. Missing criteria*: If all three fields are empty, system returns form error: *"Pick at least one thing to watch: an area, a rent limit or a room type."*
  - *E2. Invalid rent value*: If user enters letters or negative amount, system flags: *"Enter a whole number, like 6000."*
- **Data Read/Written**:
  - *Read*: `ENT-005 (VacancyAlert)`.
  - *Written*: `ENT-005 (VacancyAlert)`.
- **Security/Authorization**: Strict `student` role guard with `emailVerified === true`.
- **Related IDs**: `FR-005`, `NFR-PERF-001`, `API-005`, `ENT-005`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/AlertsPage.jsx#L1-L156](file:///e:/Coding_Projects/rommie-webapp/src/pages/AlertsPage.jsx#L1-L156), [src/services/api.js#L209-L232](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L209-L232).

---

#### UC-006: Register Student Account
- **Primary Actor**: Student (Visitor).
- **Supporting Actors**: Google OAuth Provider (external), Email Service Provider (external).
- **Goal**: Create a new student account on Rommie and receive a 6-digit email verification OTP.
- **Trigger**: Visitor clicks *"Create an account"* from header or login screen.
- **Preconditions**: Visitor does not hold an active authenticated session.
- **Postconditions**: New `User` record created with `role: "student"` and `emailVerified: false`; user routed to `/verify-email`.
- **Main Success Flow**:
  1. Visitor navigates to `/signup`.
  2. Form prompts for: First Name, Last Name, School (dropdown of 5 partner campuses or "Other"), School Name (if Other), Email, Phone Number (Kenyan format `07xx` / `01xx`), and Password (min 8 chars). Phone number is collected for WhatsApp and phone inquiries but is not verified via SMS OTP.
  3. Visitor submits form.
  4. System normalizes phone via [`normalizeKenyanPhone`](file:///e:/Coding_Projects/rommie-webapp/src/lib/format.js#L14) to `+254...` and validates format against regex `^\+254[17]\d{8}# Use Cases and User Stories Specification

## Document Metadata

| Attribute | Details |
| :--- | :--- |
| **Document ID** | `DOC-UCUS-001` |
| **Version** | 1.1 |
| **Status** | Draft (Pending Owner Approval) |
| **Author** | Antigravity AI Agent (Senior Systems Analyst & Backend Technical Lead) |
| **Created** | 2026-10-19 |
| **Target Application** | Rommie — Student Accommodation Web Platform (Karen/Rongai, Kenya) |
| **Primary Repository** | `e:\Coding_Projects\rommie-webapp` |
| **Traceability Documents** | [house_hunting_web_app_nfrs.md](file:///e:/Coding_Projects/rommie-webapp/house_hunting_web_app_nfrs.md), [SYSTEM_ARCHITECTURE.md](file:///e:/Coding_Projects/rommie-webapp/docs/SYSTEM_ARCHITECTURE.md), and [AGENTS.md](file:///e:/Coding_Projects/rommie-webapp/AGENTS.md) Section 7 |

---

## Change History

| Version | Date | Author | Summary of Changes |
| :--- | :--- | :--- | :--- |
| 1.1 | 2026-11-06 | Antigravity AI Agent | Design Review v1.1 Updates (Alvan's Review):<br/>1. Transitioned OTP verification and vacancy alerts from SMS Gateway to Transactional Email Service (Brevo/Postmark/AWS SES) with per-email and per-IP rate limiting; Google OAuth accounts bypass verification; User entity updated from phoneVerified to emailVerified.<br/>2. Retired Student ID verification (UC-009, US-009 marked RETIRED/REMOVED; UC-028/US-028 updated to Caretaker-only KYC queue; UI routes and badges removed).<br/>3. Caretaker listing photo requirements updated to exactly 10 photos with specified shot breakdown, no pre-compression file size limit, and no limit on total listings per caretaker. |
| 1.0 | 2026-10-19 | Antigravity AI Agent | Initial baseline release detailing 35 end-to-end Use Cases (UC-001 to UC-035), 35 User Stories (US-001 to US-035) with Given/When/Then acceptance criteria, Mermaid use case boundaries, and cross-tier traceability to FR, NFR, API, Entity, and Vitest test suites. |

---

## Executive Summary & Scope

Rommie is a hyper-localized student accommodation discovery platform designed specifically for tertiary students attending universities in the Karen and Rongai peri-urban corridors of Nairobi and Kajiado counties, Kenya:
1. **Kenya School of Law (KSL)** (Karen)
2. **JKUAT Karen Campus** (Bogani Road)
3. **Tangaza University** (Karen)
4. **Catholic University of Eastern Africa (CUEA)** (Bogani East Road)
5. **Co-operative University of Kenya** (Ushirika Road, Karen)

The primary residential settlement zones covered by Rommie include **Gataka**, **Ongata Rongai**, **Maasai Lodge**, and **Karen Central**.

This document establishes the authoritative functional specification through **35 Use Cases** and **35 User Stories**. Every use case and story is grounded in concrete repository evidence extracted from the frontend implementation ([src/routes.jsx](file:///e:/Coding_Projects/rommie-webapp/src/routes.jsx), [src/services/api.js](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js), [src/types/index.js](file:///e:/Coding_Projects/rommie-webapp/src/types/index.js), and individual page components).

### Requirement Status Classification
- **Confirmed**: Explicitly implemented in the UI, client service layer, and Vitest test suites.
- **Inferred**: Derived logically from existing user journeys, error handling, or validation constraints.
- **Proposed**: Architectural or functional enhancements required for backend production readiness.
- **Needs Decision**: Explicit trade-offs or configuration choices requiring project owner approval.

---

## 1. System Actors & Stakeholder Hierarchy

```
+----------------------------------------------------------------------------------------------------+
|                                    ACTOR TAXONOMY & ACCESS MATRIX                                  |
+-------------------+---------------+-----------------------+----------------------------------------+
| Actor Name        | Actor Type    | System Role           | Primary Capabilities & Objectives      |
+-------------------+---------------+-----------------------+----------------------------------------+
| Student           | Human (End)   | `student`             | Browse/filter listings, inspect rooms, |
|                   |               | (or Visitor / Guest)  | contact caretakers via WhatsApp/phone, |
|                   |               |                       | save favorites, set email vacancy alerts,|
|                   |               |                       | report bad listings                    |
+-------------------+---------------+-----------------------+----------------------------------------+
| Caretaker         | Human (End)   | `caretaker`           | Register accommodation, post & edit 20+|
|                   |               |                       | property attributes, upload photos,    |
|                   |               |                       | toggle vacancy status, reconfirm stale |
|                   |               |                       | listings, clone building room types,   |
|                   |               |                       | submit National ID, track trust score  |
+-------------------+---------------+-----------------------+----------------------------------------+
| Administrator     | Human (Ops)   | `admin`               | Platform governance, view 6 dashboard  |
|                   |               |                       | KPI metrics, hide/restore listings,    |
|                   |               |                       | review abuse reports, suspend users,   |
|                   |               |                       | review ID verification queue, inspect  |
|                   |               |                       | audit logs & platform analytics        |
+-------------------+---------------+-----------------------+----------------------------------------+
| Google OAuth      | External      | Identity Provider     | Federated authentication via OIDC      |
| Provider          | Service       | (IdP)                 | ID tokens (simulated in mock client)   |
+-------------------+---------------+-----------------------+----------------------------------------+
| Email Service     | External      | Transactional Email    | Outbound delivery of 6-digit OTP codes |
| Provider          | Service       | Service                | and matching vacancy alert emails      |
+-------------------+---------------+-----------------------+----------------------------------------+
| Maps Provider     | External      | Geospatial Service    | Direct outbound deep linking to Google |
|                   | Service       |                       | Maps search coordinates/queries        |
+-------------------+---------------+-----------------------+----------------------------------------+
```

---

## 2. Mermaid Use Case Diagram

The following diagram defines the operational boundaries and interactions between human actors, external services, and the Rommie platform use cases:

```mermaid
flowchart TB
    subgraph Actors ["Primary & External Actors"]
        StudentActor["Student / Visitor"]
        CaretakerActor["Caretaker / Landlord"]
        AdminActor["Platform Administrator"]
        GoogleActor["Google OAuth Provider"]
        EmailActor["Email Service Provider (Brevo/SES)"]
        MapsActor["Google Maps Platform"]
    end

    subgraph RommieApp ["Rommie Accommodation Platform"]
        subgraph StudentDomain ["Student Capabilities"]
            UC001["UC-001: Browse & Search Rooms"]
            UC002["UC-002: View Room Details"]
            UC003["UC-003: Contact Caretaker"]
            UC004["UC-004: Save/Unsave Rooms"]
            UC005["UC-005: Manage Vacancy Alerts"]
            UC006["UC-006: Register Student Account"]
            UC007["UC-007: Log In"]
            UC008["UC-008: Verify Email via OTP"]
            UC009["UC-009: [RETIRED] Student ID Verification"]
            UC010["UC-010: Report a Listing"]
            UC011["UC-011: View Campus Zones"]
        end

        subgraph CaretakerDomain ["Caretaker Capabilities"]
            UC012["UC-012: Register Caretaker Account"]
            UC013["UC-013: Log In as Caretaker"]
            UC014["UC-014: Post Room Listing (10 Photos)"]
            UC015["UC-015: Edit Own Listing"]
            UC016["UC-016: Toggle Room Vacancy Status"]
            UC017["UC-017: Reconfirm Stale/Hidden Listing"]
            UC018["UC-018: Delete Own Listing"]
            UC019["UC-019: Add Another Room Type to Building"]
            UC020["UC-020: Submit Caretaker ID Verification"]
            UC021["UC-021: View Trust Score Breakdown"]
        end

        subgraph AdminDomain ["Admin Moderation Capabilities"]
            UC022["UC-022: View Platform Dashboard"]
            UC023["UC-023: Hide Stale Listings"]
            UC024["UC-024: Restore Hidden Listings"]
            UC025["UC-025: Manage All Listings"]
            UC026["UC-026: Review User Reports"]
            UC027["UC-027: Manage Users"]
            UC028["UC-028: Review Verification Queue (Caretaker KYC)"]
            UC029["UC-029: Undo Verification Decision"]
            UC030["UC-030: View Admin Activity Log"]
            UC031["UC-031: View Platform Analytics"]
            UC032["UC-032: Update Site Settings"]
        end

        subgraph SystemDomain ["System & Client Capabilities"]
            UC033["UC-033: Cross-Tab Session Sync"]
            UC034["UC-034: Offline Detection"]
            UC035["UC-035: Client-Side Image Compression"]
        end
    end

    %% Student Relationships
    StudentActor --> UC001
    StudentActor --> UC002
    StudentActor --> UC003
    StudentActor --> UC004
    StudentActor --> UC005
    StudentActor --> UC006
    StudentActor --> UC007
    StudentActor --> UC008
    %% UC009 Retired: Student ID verification removed per design review
    StudentActor --> UC010
    StudentActor --> UC011

    %% Caretaker Relationships
    CaretakerActor --> UC012
    CaretakerActor --> UC013
    CaretakerActor --> UC014
    CaretakerActor --> UC015
    CaretakerActor --> UC016
    CaretakerActor --> UC017
    CaretakerActor --> UC018
    CaretakerActor --> UC019
    CaretakerActor --> UC020
    CaretakerActor --> UC021

    %% Admin Relationships
    AdminActor --> UC022
    AdminActor --> UC023
    AdminActor --> UC024
    AdminActor --> UC025
    AdminActor --> UC026
    AdminActor --> UC027
    AdminActor --> UC028
    AdminActor --> UC029
    AdminActor --> UC030
    AdminActor --> UC031
    AdminActor --> UC032

    %% External System Integrations
    UC006 -.-> GoogleActor
    UC007 -.-> GoogleActor
    UC012 -.-> GoogleActor
    UC013 -.-> GoogleActor
    UC008 -.-> SmsActor
    UC005 -.-> SmsActor
    UC002 -.-> MapsActor

    %% Internal Includes / Extends
    UC014 ..> UC035 : "<<include>>"
    UC019 ..> UC035 : "<<include>>"
    UC007 ..> UC033 : "<<include>>"
```

---

## 3. Detailed Use Case Specifications

---

### 3.1 Student Use Cases (UC-001 to UC-011)

#### UC-001: Browse and Search Rooms
- **Primary Actor**: Student (or Anonymous Visitor).
- **Supporting Actors**: None.
- **Goal**: Find vacant accommodations matching specific criteria across budget, location, amenities, and campus proximity.
- **Trigger**: User navigates to `/rooms` or submits search parameters from the header capsule.
- **Preconditions**: Web application is loaded in browser.
- **Postconditions**: URL search string updates with serialized filter state (`?area=...&maxRent=...`); filtered list of room cards renders; vacant rooms prioritized.
- **Main Success Flow**:
  1. User accesses `/rooms`.
  2. System reads URL parameters via [`useSearch(validateSearch)`](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomsPage.jsx#L17-L29).
  3. System calls [`getRooms(filters)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L135-L173).
  4. System filters out listings where `hidden === true` or where the owning caretaker is suspended via `isSuspended(r.caretakerId)`.
  5. System evaluates criteria: `area`, `roomType`, `minRent`, `maxRent`, `gender`, `mealsOnly`, `transportOnly`, `vacantOnly`, `amenities`, and `near` (campus walk/matatu <= 20 mins or guide hostel match).
  6. System sorts matching rooms: vacant listings first, then ordered by selected sort (`newest` confirmed date, `rent_asc`, or `rent_desc`).
  7. System renders responsive room cards with cover photo, rent, area, distance chip, confirmation badge, and trust indicators.
- **Alternative Flows**:
  - *3a. User adjusts filters on desktop sidebar or mobile bottom sheet*:
    1. User modifies a filter chip (e.g., toggles "WiFi" or changes Area to "Rongai").
    2. System updates URL query state using `replace: true`.
    3. React Query detects key change `["rooms", filters]` and updates listing view with `keepPreviousData`.
  - *6a. Zero matching listings found*:
    1. System displays empty state: *"No rooms match yet."*
    2. System presents action button *"Create a vacancy alert"* which pre-fills alert form with current search criteria, and *"Clear filters"* button.
- **Exceptions**:
  - *E1. Network or service error*: System displays error card *"Couldn't load rooms"* with a *"Retry"* button.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-003 (Caretaker)`.
  - *Written*: Client browser URL query string.
- **Security/Authorization**: Publicly accessible. Excludes quarantined (`hidden`) or suspended caretaker listings.
- **Related IDs**: `FR-001`, `NFR-PERF-001`, `NFR-USA-001`, `API-001`, `ENT-001`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/RoomsPage.jsx#L17-L147](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomsPage.jsx#L17-L147), [src/services/api.js#L135-L173](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L135-L173).

---

#### UC-002: View Room Details
- **Primary Actor**: Student (or Anonymous Visitor).
- **Supporting Actors**: Maps Provider (external).
- **Goal**: Review exhaustive property attributes, inspect high-resolution photographs, check commute times, and verify caretaker trust score before making contact.
- **Trigger**: User clicks a room card from `/rooms`, `/saved`, or `/zones`.
- **Preconditions**: Target room ID exists in data store.
- **Postconditions**: Room details, photos, caretaker trust score, and building sibling listings are rendered.
- **Main Success Flow**:
  1. User navigates to `/rooms/:id`.
  2. System invokes [`getRoom(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L174-L178).
  3. System validates that the listing is neither hidden nor belonging to a suspended caretaker.
  4. System fetches caretaker trust score and resolves verification status via [`computeTrust`](file:///e:/Coding_Projects/rommie-webapp/src/lib/trust.js#L9-L48).
  5. System triggers background query [`getBuildingRooms(room.buildingId, room.id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L254-L257) if `buildingId` is defined.
  6. System renders layout:
     - Desktop 5-photo grid or mobile swipe carousel with snap scrolling.
     - Title, area, room type label, and vacancy confirmation badge.
     - Pricing breakdown: monthly rent, deposit terms, and hostel room options (if applicable).
     - Commute distance breakdown: walking and matatu minutes per campus (KSL, JKUAT, Tangaza, CUEA, Co-op), and estimated matatu fare in KES.
     - External Google Maps link (`mapLink`).
     - Included amenities list.
     - Caretaker trust card showing score (0-100) and verified badge.
     - Other room types available in the same building.
     - Safety disclaimer: *"Never pay before viewing. Visit with a friend and confirm the caretaker's identity."*
  7. User clicks a photo to open the interactive full-screen Lightbox with thumbnail navigation and keyboard/swipe controls.
- **Alternative Flows**:
  - *2a. Listing belongs to a hostel*:
    1. System renders hostel-specific option table (e.g., "Single ensuite", "4 sharing") with option-specific photos and prices.
    2. System displays registration fee notice and Dean of Students Guide badge if `inGuide === true`.
- **Exceptions**:
  - *E1. Room ID does not exist, is hidden, or caretaker is suspended*:
    1. System renders *"Room not found"* state with a button to *"Browse rooms"*.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-003 (Caretaker)`, `ENT-011 (Building)`.
  - *Written*: None.
- **Security/Authorization**: Public access. Quarantined or suspended properties are blocked with 404 behavior.
- **Related IDs**: `FR-002`, `NFR-PERF-003`, `NFR-USA-002`, `API-002`, `ENT-001`, `ENT-003`, `TC-HST-001`.
- **UI Evidence Paths**: [src/pages/RoomDetailPage.jsx#L1-L292](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomDetailPage.jsx#L1-L292), [src/services/api.js#L174-L178](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L174-L178).

---

#### UC-003: Contact Caretaker
- **Primary Actor**: Student (or Anonymous Visitor).
- **Supporting Actors**: WhatsApp Application / Native Dialer.
- **Goal**: Contact property caretaker directly to arrange a viewing while Rommie tracks student interest.
- **Trigger**: User taps *"WhatsApp"* or *"Call"* action button on room details or room card.
- **Preconditions**: Room details are displayed on screen; caretaker contact numbers are present.
- **Postconditions**: Native WhatsApp chat or dialer opens; system records contact event if outside 30s deduplication window.
- **Main Success Flow**:
  1. Student taps *"WhatsApp"* or *"Call"* on a room listing.
  2. System triggers fire-and-forget telemetry via [`trackContact(roomId, channel)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L59-L77).
  3. System evaluates tracking guards:
     - Ignores if user is signed in as `admin`.
     - Ignores if user is signed in as the listing's own caretaker (`u.id === room.caretakerId`).
     - Ignores if identical contact on same room and channel occurred within the last 30,000ms (`CONTACT_DEDUPE_MS = 30000`).
  4. If guards pass, system appends record `{ id, roomId, channel, at, userId? }` to `rommie.contacts` (capped at 2,000 entries).
  5. For WhatsApp: browser opens deep link `https://wa.me/<number>?text=<encoded_inquiry>`.
  6. For Call: browser invokes native `tel:<callNumber>`.
- **Alternative Flows**:
  - *3a. Duplicate tap within 30 seconds*: System permits external deep link launch immediately but suppresses secondary counter increment.
- **Exceptions**:
  - *E1. Tracking fails or localStorage full*: Catch-block swallows error silently so student contact is never hindered.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-002 (User session)`.
  - *Written*: `ENT-008 (ContactEvent)`.
- **Security/Authorization**: Open to all users. Caretakers and admins excluded from metrics inflation.
- **Related IDs**: `FR-003`, `NFR-INT-003`, `API-003`, `ENT-008`, `TC-CON-001`, `TC-CON-002`, `TC-CON-003`, `TC-CON-004`.
- **UI Evidence Paths**: [src/services/api.js#L59-L77](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L59-L77), [src/pages/RoomDetailPage.jsx#L264-L265](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomDetailPage.jsx#L264-L265), [src/test/contacts.test.js#L1-L60](file:///e:/Coding_Projects/rommie-webapp/src/test/contacts.test.js#L1-L60).

---

#### UC-004: Save/Unsave Rooms
- **Primary Actor**: Student.
- **Supporting Actors**: None.
- **Goal**: Maintain a personal shortlist of preferred rooms for quick comparison.
- **Trigger**: Student clicks Heart icon on Room Card or Save button on Room Details page.
- **Preconditions**: User must be authenticated with role `student`.
- **Postconditions**: Room ID added or removed from student's saved list; UI updates optimistically with toast feedback.
- **Main Success Flow**:
  1. Student taps Heart icon on a listing.
  2. [`useSaved()`](file:///e:/Coding_Projects/rommie-webapp/src/lib/saved.js#L9-L48) checks user authentication.
  3. User is signed in as `student`.
  4. System executes optimistic update: immediately alters cached query data `["saved-ids", userId]` and flips heart visual state.
  5. System sends asynchronous request [`saveRoom(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L187-L193) or [`unsaveRoom(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L194-L198).
  6. Toast notification confirms: *"Saved to your rooms"* or *"Removed from saved rooms"*.
  7. Student navigates to `/saved` to view full grid of saved listings.
- **Alternative Flows**:
  - *2a. Unauthenticated visitor taps Save*:
    1. System invokes [`useAuthGate`](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L39-L49).
    2. Displays toast: *"Log in to save rooms."*
    3. Redirects visitor to `/login?redirect=/current/page`.
  - *2b. Signed in caretaker or admin taps Save*:
    1. System blocks action and displays toast: *"Saving rooms is for student accounts."*
- **Exceptions**:
  - *E1. Network call fails*: Optimistic state rolls back to previous cache snapshot; error toast displays: *"Couldn't update your saved rooms. Try again."*
- **Data Read/Written**:
  - *Read*: `ENT-004 (SavedRoom)`, `ENT-001 (Room)`.
  - *Written*: `ENT-004 (SavedRoom)`.
- **Security/Authorization**: Restricted to `role === "student"`.
- **Related IDs**: `FR-004`, `NFR-USA-001`, `API-004`, `ENT-004`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/lib/saved.js#L1-L49](file:///e:/Coding_Projects/rommie-webapp/src/lib/saved.js#L1-L49), [src/pages/SavedPage.jsx#L1-L41](file:///e:/Coding_Projects/rommie-webapp/src/pages/SavedPage.jsx#L1-L41), [src/services/api.js#L179-L208](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L179-L208).

---

#### UC-005: Manage Vacancy Alerts
- **Primary Actor**: Student.
- **Supporting Actors**: Email Service Provider (external).
- **Goal**: Subscribe to automated email and in-app notifications when a matching room becomes vacant, and manage existing subscriptions.
- **Trigger**: Student navigates to `/alerts` or clicks *"Create a vacancy alert"* from empty search results.
- **Preconditions**: Authenticated user with role `student` and a verified email address (`emailVerified: true`).
- **Postconditions**: New `VacancyAlert` persisted; system triggers email & in-app alert delivery when matching listing is marked vacant.
- **Main Success Flow**:
  1. Student accesses `/alerts`.
  2. System verifies `RequireRole(["student"])`.
  3. Student specifies search parameters: Area (e.g., "Gataka"), Max Rent in KES (e.g., 7,500), and Room Type (e.g., "bedsitter").
  4. System dynamically generates live summary: *"You'll get an email alert for: Bedsitter in Gataka under KES 7,500/month."*
  5. Student submits form.
  6. System validates criteria, assigns UUID, marks `active: true`, and invokes [`createAlert(data)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L211-L217).
  7. Toast confirms: *"Alert created. We'll email you when a match opens."*
  8. Alert appears in "Your alerts" list with creation timestamp and matching room links.
- **Alternative Flows**:
  - *3a. Student toggles alert active status*:
    1. Student toggles Switch on an existing alert card.
    2. Optimistic update fires; system calls [`updateAlert(id, { active })`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L223-L227).
    3. Status pill toggles between "On" and "Paused".
  - *3b. Student deletes an alert*:
    1. Student clicks Trash button on an alert card.
    2. System calls [`deleteAlert(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L228-L232); card removes with toast notification *"Alert deleted"*.
- **Exceptions**:
  - *E1. Missing criteria*: If all three fields are empty, system returns form error: *"Pick at least one thing to watch: an area, a rent limit or a room type."*
  - *E2. Invalid rent value*: If user enters letters or negative amount, system flags: *"Enter a whole number, like 6000."*
- **Data Read/Written**:
  - *Read*: `ENT-005 (VacancyAlert)`.
  - *Written*: `ENT-005 (VacancyAlert)`.
- **Security/Authorization**: Strict `student` role guard with `emailVerified === true`.
- **Related IDs**: `FR-005`, `NFR-PERF-001`, `API-005`, `ENT-005`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/AlertsPage.jsx#L1-L156](file:///e:/Coding_Projects/rommie-webapp/src/pages/AlertsPage.jsx#L1-L156), [src/services/api.js#L209-L232](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L209-L232).

---

.
  5. System validates email uniqueness against registered accounts.
  6. System creates account via [`signUp(data)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L706-L717) with initial ID prefix `u-` and `emailVerified: false`.
  7. System transmits a 6-digit OTP to the registered email address via the Transactional Email Service.
  8. System enforces rate limiting: maximum 5 OTP requests per hour per email address and 20 requests per hour per client IP to combat automated disposable mailbox abuse.
  9. System sets session in localStorage and navigates visitor to `/verify-email`.
- **Alternative Flows**:
  - *2a. Visitor signs up with Google*:
    1. Visitor taps *"Sign up with Google"*.
    2. Simulated Google OAuth resolves with verified email and display name.
    3. System creates user record with `google: true` and `emailVerified: true` (bypassing email verification since Google guarantees email authenticity).
    4. System immediately routes authenticated student to destination or `/rooms`.
- **Exceptions**:
  - *E1. Email already exists*: System returns `AuthError` on email field: *"An account with this email already exists. Try logging in."*
  - *E2. Phone already exists*: System returns `AuthError` on phone field: *"An account with this number already exists. Try logging in."*
  - *E3. Rate limit exceeded*: System returns HTTP 429: *"Too many verification codes requested. Please wait 15 minutes before trying again."*
- **Data Read/Written**:
  - *Read*: `ENT-002 (User)`.
  - *Written*: `ENT-002 (User)`.
- **Security/Authorization**: Open to visitors. Passwords validated for length; phone normalized; email OTP rate-limited per email and per IP.
- **Related IDs**: `FR-033`, `NFR-SEC-003`, `API-001`, `ENT-002`, `TC-AUTH-001`, `TC-FMT-001`.
- **UI Evidence Paths**: [src/components/auth/SignupForm.jsx#L1-L123](file:///e:/Coding_Projects/rommie-webapp/src/components/auth/SignupForm.jsx#L1-L123), [src/services/api.js#L706-L727](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L706-L727).

---

#### UC-007: Log In
- **Primary Actor**: Student, Caretaker, or Admin.
- **Supporting Actors**: Google OAuth Provider (external).
- **Goal**: Authenticate into Rommie and route to role-appropriate workspace.
- **Trigger**: User navigates to `/login` or `/caretaker/login`.
- **Preconditions**: User has an existing registered account.
- **Postconditions**: Authenticated session established; user redirected to destination or role home.
- **Main Success Flow**:
  1. User accesses `/login`.
  2. User enters registered Email and Password.
  3. System calls [`login({ email, password })`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L729-L742).
  4. System matches normalized email and verifies credentials.
  5. System verifies that if user is a caretaker, they are not suspended.
  6. System persists session to localStorage key `rommie.session` and notifies active listeners.
  7. If user's email is unverified (`emailVerified: false`), system redirects to `/verify-email`.
  8. If email is verified, system evaluates `redirect` query parameter via [`safeRedirect`](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L17-L19); if absent, routes to role home (`/rooms` for student, `/caretaker/listings` for caretaker, `/admin` for admin).
- **Alternative Flows**:
  - *2a. User logs in with Google*:
    1. User taps *"Continue with Google"*.
    2. [`loginWithGoogle`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L747-L762) matches existing account by email.
    3. Google-authenticated sessions are treated as having verified email (`emailVerified: true`) by default and bypass email verification.
    4. Session established and forwarded to requested destination.
- **Exceptions**:
  - *E1. Invalid password or nonexistent email*: System throws `AuthError`: *"Email or password is incorrect."*
  - *E2. Password entered for Google-only account*: System prompts: *"This account uses Google. Tap Continue with Google instead."*
  - *E3. Suspended caretaker attempts login*: System halts authentication and displays: *"This account is suspended. Contact Rommie to get it restored."*
- **Data Read/Written**:
  - *Read*: `ENT-002 (User)`.
  - *Written*: Browser session storage.
- **Security/Authorization**: Open to visitors. Blocks open redirect exploits (disallows leading `//` or `/\`). Blocks suspended accounts.
- **Related IDs**: `FR-007`, `NFR-SEC-003`, `API-007`, `ENT-002`, `TC-AUTH-001`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/components/auth/LoginForm.jsx#L1-L68](file:///e:/Coding_Projects/rommie-webapp/src/components/auth/LoginForm.jsx#L1-L68), [src/lib/auth.jsx#L13-L35](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L13-L35), [src/services/api.js#L729-L762](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L729-L762).

---

#### UC-008: Verify Email via OTP
- **Primary Actor**: Student or Caretaker.
- **Supporting Actors**: Email Service Provider (external, e.g. Brevo, Postmark, AWS SES).
- **Goal**: Confirm email address ownership using a 6-digit one-time code to prevent spam, enable email alerts, and secure caretaker listings.
- **Trigger**: Post-registration redirection or access to unverified protected routes.
- **Preconditions**: Authenticated session with `emailVerified: false`.
- **Postconditions**: Account's `emailVerified` attribute is set to `true`; user redirected to original requested route.
- **Main Success Flow**:
  1. User arrives on `/verify-email`.
  2. System sends initial 6-digit numeric OTP to user's registered email address via [`sendOtp(email)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L800) and starts a 60-second resend cooldown timer.
  3. User receives email and inputs 6-digit code into [`OtpBoxes`](file:///e:/Coding_Projects/rommie-webapp/src/components/auth/OtpBoxes.jsx).
  4. System automatically calls [`verifyOtp(email, code)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L802-L816) when the 6th digit is typed.
  5. System validates code against 5-minute TTL (`OTP_TTL_MS = 300000`).
  6. Code matches valid mock ("123456") or cryptographically generated email token.
  7. System sets `user.emailVerified = true` in memory, accounts store, and localStorage session.
  8. System displays toast *"Email verified"* and routes user forward via [`useGoAfterAuth`](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L29-L35).
- **Alternative Flows**:
  - *2a. User signed up via Google*:
    1. Google provides a pre-verified email; `emailVerified` is set to `true` automatically upon account provisioning.
    2. Verification step is completely bypassed.
  - *3a. User requests new code after timer expires*:
    1. User taps *"Resend code"*.
    2. System verifies that 60-second cooldown has elapsed.
    3. System verifies rate limits (max 5 requests/hour per email, max 20/hour per IP).
    4. System dispatches fresh OTP and resets 60s countdown.
- **Exceptions**:
  - *E1. Incorrect OTP code*: System rejects input, clears input boxes, and displays error: *"That code isn't right. Check it and try again."*
  - *E2. Expired OTP (> 5 minutes)*: System displays error: *"That code has expired. Request a new one."*
  - *E3. Rate limit exceeded*: System displays error: *"Too many verification codes requested. Please try again later."*
- **Data Read/Written**:
  - *Read*: `ENT-002 (User)`.
  - *Written*: `ENT-002 (User.emailVerified)`.
- **Security/Authorization**: Authenticated session required. 5-minute hard expiration; 60-second resend throttling; per-email and per-IP rate limiting to thwart mailbox spam and bot account creation.
- **Related IDs**: `FR-036`, `NFR-SEC-002`, `API-004`, `API-005`, `ENT-002`, `TC-AUTH-001`.
- **UI Evidence Paths**: [src/pages/VerifyPhonePage.jsx#L1-L132](file:///e:/Coding_Projects/rommie-webapp/src/pages/VerifyPhonePage.jsx#L1-L132), [src/services/api.js#L798-L816](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L798-L816).

---

#### UC-009: [RETIRED / REMOVED] Submit Student ID Verification
- **Status**: **RETIRED / REMOVED** per Alvan's design review.
- **Stable ID Policy**: Per [AGENTS.md](file:///e:/Coding_Projects/rommie-webapp/AGENTS.md) Rule 9, requirement and use case identifiers are permanent and must never be deleted or renumbered. `UC-009` is formally retired.
- **Rationale for Removal**: Student ID verification added substantial friction to student onboarding without providing critical anti-fraud value (unlike Caretaker National ID verification). The product strategy focuses verification exclusively on landlords and caretakers who receive tenant deposits.
- **Codebase Reconciliation**:
  - Removed client route `/verify-student` from `src/routes.jsx` (commit `eb9e112`).
  - Deleted page component `src/pages/VerifyStudentPage.jsx`.
  - Removed student verified badge from profile menu dropdown and mobile drawer in `src/components/SiteHeader.jsx`.
  - Removed student ID verification test block from `src/test/student-admin.test.js`.
- **Preserved Shared Components**:
  - Shared verification entity (`ENT-008 / verification_requests`), document upload primitive (`DocumentUpload.jsx`), caretaker verification submission (`submitVerification("caretaker", file)`), and admin rollback (`UC-029`) remain fully active for Caretaker KYC.
- **Related IDs**: `FR-006 (RETIRED)`, `US-009 (RETIRED)`.

---

#### UC-010: Report a Listing
- **Primary Actor**: Student (or Visitor).
- **Supporting Actors**: None.
- **Goal**: Flag inaccurate, fraudulent, or outdated listings to alert the moderation team.
- **Trigger**: User clicks *"Report"* button on room details or room card.
- **Preconditions**: Listing exists.
- **Postconditions**: `Report` record created with status `"open"`; admin reports queue updated.
- **Main Success Flow**:
  1. User clicks *"Report"* on a listing.
  2. System opens [`ReportModal`](file:///e:/Coding_Projects/rommie-webapp/src/components/ReportModal.jsx).
  3. System presents five radio options:
     - `Fake listing`
     - `Already taken`
     - `Wrong price`
     - `Wrong photos`
     - `Other`
  4. User selects a reason. If `Other`, an explanatory textarea is revealed.
  5. User submits report.
  6. System calls [`submitReport(roomId, reason, note)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L285-L288).
  7. System records report with `status: "open"`.
  8. Toast confirms: *"Report sent"*; modal transitions to completion confirmation.
- **Alternative Flows**: None.
- **Exceptions**:
  - *E1. User attempts to submit without picking a reason*: Submit button remains disabled.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`.
  - *Written*: `ENT-006 (Report)`.
- **Security/Authorization**: Open to all users to maximize community vigilance.
- **Related IDs**: `FR-010`, `NFR-USA-001`, `API-010`, `ENT-006`, `TC-ADM-REP-001`.
- **UI Evidence Paths**: [src/components/ReportModal.jsx#L1-L49](file:///e:/Coding_Projects/rommie-webapp/src/components/ReportModal.jsx#L1-L49), [src/services/api.js#L285-L288](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L285-L288).

---

#### UC-011: View Campus Zones
- **Primary Actor**: Student (or Visitor).
- **Supporting Actors**: None.
- **Goal**: Discover vacant rooms within a 20-minute commute of one of the 5 specific partner universities.
- **Trigger**: User navigates to `/zones`.
- **Preconditions**: Web application is loaded.
- **Postconditions**: Rooms grouped by campus zone rendered, sorted nearest-first.
- **Main Success Flow**:
  1. User navigates to `/zones`.
  2. System renders overview header and area navigation chips (Gataka, Rongai, Maasai Lodge, Karen).
  3. System iterates through the 5 universities: KSL, JKUAT Karen, Tangaza, CUEA, Co-op.
  4. For each campus, system queries [`getRooms({ near: campus.id, vacantOnly: true })`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L135-L173).
  5. System sorts rooms by proximity via [`minutesTo(r, campus.id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L131-L134) (evaluating walking minutes first, then matatu minutes).
  6. System calculates the minimum rent starting price for that campus zone.
  7. System displays up to 4 preview room cards per campus with a link: *"See all near [Campus]"* (which routes to `/rooms?near=[campus.id]`).
- **Alternative Flows**:
  - *5a. No vacant listings within 20 minutes of campus*: System renders friendly placeholder: *"No vacant rooms near [Campus] right now. Create an alert and we'll text you when one opens."*
- **Exceptions**:
  - *E1. Network error*: System presents error card with retry button.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`.
  - *Written*: None.
- **Security/Authorization**: Public access.
- **Related IDs**: `FR-011`, `NFR-PERF-001`, `API-011`, `ENT-001`, `TC-HST-001`.
- **UI Evidence Paths**: [src/pages/ZonesPage.jsx#L1-L55](file:///e:/Coding_Projects/rommie-webapp/src/pages/ZonesPage.jsx#L1-L55), [src/services/api.js#L131-L173](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L131-L173).

---

### 3.2 Caretaker Use Cases (UC-012 to UC-021)

#### UC-012: Register Caretaker Account
- **Primary Actor**: Property Caretaker / Landlord.
- **Supporting Actors**: Google OAuth Provider (external), Email Service Provider (external).
- **Goal**: Create a caretaker account to publish and manage student rentals, verified via email OTP.
- **Trigger**: Caretaker clicks *"List your rooms"* or navigates to `/caretaker/signup`.
- **Preconditions**: Caretaker is not signed in.
- **Postconditions**: New `User` record created with `role: "caretaker"` and `emailVerified: false`; corresponding `Caretaker` entity instantiated; user redirected to `/verify-email`.
- **Main Success Flow**:
  1. Caretaker accesses `/caretaker/signup`.
  2. Form prompts for: First Name, Last Name, Email, Kenyan Phone (`07xx`/`01xx`), and Password. School selection is omitted. Phone number is collected for WhatsApp and voice call inquiries from students but is not verified with an SMS code.
  3. Caretaker submits form.
  4. System normalizes phone via [`normalizeKenyanPhone`](file:///e:/Coding_Projects/rommie-webapp/src/lib/format.js#L14).
  5. System calls [`signUp(data)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L706-L727) with `role: "caretaker"`.
  6. System creates `User` (ID prefix `c-`) with `emailVerified: false` and automatically initializes `Caretaker` profile record with `verified: false`, baseline `trustScore: 50`, and `joinedAt: new Date().toISOString()`.
  7. System transmits a 6-digit OTP code to the caretaker's email address via the Transactional Email Service.
  8. System enforces rate limiting (max 5 requests/hour per email, max 20/hour per IP).
  9. System sets session and routes caretaker to `/verify-email`.
- **Alternative Flows**:
  - *2a. Caretaker signs up with Google*: System routes through OAuth flow, assigns role `caretaker`, marks `emailVerified: true`, creates base caretaker record, and bypasses email verification.
- **Exceptions**:
  - *E1. Duplicate email or phone*: Form displays validation error on specific input field.
  - *E2. Rate limit exceeded*: System flags excessive OTP requests.
- **Data Read/Written**:
  - *Read*: `ENT-002 (User)`, `ENT-003 (Caretaker)`.
  - *Written*: `ENT-002 (User)`, `ENT-003 (Caretaker)`.
- **Security/Authorization**: Open to visitors. Email OTP rate limited.
- **Related IDs**: `FR-033`, `NFR-SEC-003`, `API-001`, `ENT-002`, `ENT-003`, `TC-AUTH-001`.
- **UI Evidence Paths**: [src/components/auth/SignupForm.jsx#L34-L123](file:///e:/Coding_Projects/rommie-webapp/src/components/auth/SignupForm.jsx#L34-L123), [src/services/api.js#L718-L727](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L718-L727).

---

#### UC-013: Log In as Caretaker
- **Primary Actor**: Property Caretaker / Landlord.
- **Supporting Actors**: None.
- **Goal**: Access caretaker workspace to manage listings and inspect tenant inquiries.
- **Trigger**: Caretaker visits `/caretaker/login`.
- **Preconditions**: Caretaker holds registered credentials.
- **Postconditions**: Authenticated session initialized; caretaker routed to `/caretaker/listings`.
- **Main Success Flow**:
  1. Caretaker enters email and password on `/caretaker/login`.
  2. System executes [`login(data)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L729-L742).
  3. System checks caretaker suspension registry via [`isSuspended(caretakerId)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L47).
  4. Caretaker is not suspended.
  5. Session persisted; system routes caretaker to `/caretaker/listings`.
- **Alternative Flows**: None.
- **Exceptions**:
  - *E1. Caretaker account is suspended*: System halts login and throws `AuthError`: *"This account is suspended. Contact Rommie to get it restored."*
  - *E2. Invalid credentials*: System throws error: *"Email or password is incorrect."*
- **Data Read/Written**:
  - *Read*: `ENT-002 (User)`, `rommie.suspended`.
  - *Written*: Browser session storage.
- **Security/Authorization**: Role validated. Enforces suspension lockout.
- **Related IDs**: `FR-013`, `NFR-SEC-003`, `API-013`, `ENT-002`, `TC-AUTH-001`, `TC-ADM-USR-001`.
- **UI Evidence Paths**: [src/pages/CaretakerLoginPage.jsx#L1-L15](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerLoginPage.jsx#L1-L15), [src/services/api.js#L737-L738](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L737-L738).

---

#### UC-014: Post Room Listing
- **Primary Actor**: Caretaker.
- **Supporting Actors**: None.
- **Goal**: Publish a new vacant room listing with pricing, commute metrics, and exactly 10 comprehensive photos representing the property.
- **Trigger**: Caretaker clicks *"Post a room"* from dashboard or header.
- **Preconditions**: Authenticated user with role `caretaker` and verified email address (`emailVerified === true`).
- **Postconditions**: New `Room` created with `status: "Vacant"`, current timestamp as `lastConfirmedVacantAt`, and immediately visible in search.
- **Listing Limits**: **There is no limit on how many listings one caretaker can have.** Caretakers managing multiple buildings or multiple room typologies can post as many independent listings as needed.
- **Photo Requirements & Pre-Compression Specifications**:
  - **Exactly 10 photos are required** per listing (not optional, not a range). To provide prospective student tenants with an exhaustive virtual viewing, the caretaker must supply the following 10 standardized shots:
    1. **Main room / bedroom view** (wide angle)
    2. **Opposite angle of room**
    3. **Bed / living space**
    4. **Bathroom / shower / toilet**
    5. **Kitchen / kitchenette area / sink**
    6. **Closet / storage / wardrobe**
    7. **Windows / natural lighting / electrical tokens & meter**
    8. **Exterior building / entrance / gate / compound**
    9. **Balcony / corridor / common area**
    10. **Security features** (perimeter fence, security gate, guard house, street access)
  - **No file size limit before compression**: There is no cap on the original camera or gallery file size (e.g. raw 20 MB smartphone photos are accepted). The client-side application utilizes HTML5 Canvas compression (`UC-035`) to downscale and compress images to high-efficiency WebP/JPEG under 1.5 MB prior to network transmission. (Note: The 8 MB file size limit applies strictly to uncompressed verification documents such as National IDs in `UC-020`, not room photos).
- **Main Success Flow**:
  1. Caretaker navigates to `/caretaker/post`.
  2. System checks caretaker email verification (`emailVerified === true`). If unverified, redirects to `/verify-email`.
  3. System renders [`RoomForm`](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/RoomForm.jsx) with over 20 structured fields:
     - Room Type: bedsitter, single_room, one_bedroom, or hostel.
     - Area: Gataka, Rongai, Maasai Lodge, or Karen.
     - Title (5-80 chars) and Description (optional, max 600 chars).
     - Rent in KES (whole number <= 500,000) and Deposit Terms.
     - Amenity checkboxes: Water 24/7, WiFi, Tokens, Gated Security.
     - Commute inputs: Walk/Matatu minutes for KSL, JKUAT, Tangaza, CUEA, Co-op; Matatu fare in KES.
     - Google Maps location URL (`mapLink`).
     - Contact numbers: WhatsApp and Call phone numbers (prefilled from user account).
     - Photos: Upload **exactly 10 photos** satisfying the required shot checklist.
  4. Caretaker uploads 10 photos via [`PhotoUploader`](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/PhotoUploader.jsx). Photos undergo client-side canvas compression (UC-035) with zero pre-compression file size restriction.
  5. Caretaker submits form.
  6. System validates all constraints using Zod schema (including `photos.length === 10`).
  7. System invokes [`createListing(data)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L233-L238).
  8. System sets `status: "Vacant"`, `lastConfirmedVacantAt: new Date().toISOString()`, and assigns owning `caretakerId`.
  9. React Query invalidates `["my-listings"]` and `["rooms"]`.
  10. Toast confirms: *"Room posted. Students can see it now."*; system redirects to `/caretaker/listings`.
- **Alternative Flows**:
  - *3a. Caretaker selects Room Type "hostel"*:
    1. System toggles hostel-specific form controls: Gender target (Ladies, Gents, Mixed), Meals available checkbox, Transport to campus checkbox, Distance to campus (km), Registration fee (KES).
    2. Dynamic field array enables adding multiple room options with separate pricing, billing cycle, and option-specific photos.
- **Exceptions**:
  - *E1. Fewer or more than 10 photos uploaded*: System blocks submission and flags photo uploader: *"Please provide all 10 required photos of the property before publishing."*
  - *E2. Missing required campus distance*: System alerts: *"Add at least one walking or matatu time to a campus."*
  - *E3. Unverified email*: Caretaker blocked from posting until email is verified.
- **Data Read/Written**:
  - *Read*: `ENT-002 (User)`.
  - *Written*: `ENT-001 (Room)`.
- **Security/Authorization**: Restricted to `role === "caretaker"` with `emailVerified === true`.
- **Related IDs**: `FR-010`, `NFR-PERF-003`, `NFR-USA-001`, `API-012`, `API-049`, `ENT-001`, `TC-BLD-001`.
- **UI Evidence Paths**: [src/pages/CaretakerPostPage.jsx#L1-L56](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerPostPage.jsx#L1-L56), [src/components/caretaker/RoomForm.jsx#L1-L340](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/RoomForm.jsx#L1-L340).

---

#### UC-015: Edit Own Listing
- **Primary Actor**: Caretaker.
- **Supporting Actors**: None.
- **Goal**: Update pricing, terms, contact details, or photos of an existing room listing.
- **Trigger**: Caretaker clicks *"Edit"* on a listing card in `/caretaker/listings`.
- **Preconditions**: Listing exists; authenticated caretaker is verified as the owner (`room.caretakerId === user.id`).
- **Postconditions**: Room listing record updated in data store; cache refreshed.
- **Main Success Flow**:
  1. Caretaker clicks *"Edit"* on `/caretaker/listings`.
  2. System navigates to `/caretaker/edit/:id`.
  3. System fetches room details and evaluates ownership: `room.caretakerId === user.id`.
  4. System populates [`RoomForm`](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/RoomForm.jsx) with initial room parameters.
  5. Caretaker alters desired fields (e.g., reduces rent from 9,000 to 8,500 KES).
  6. Caretaker submits form.
  7. System invokes [`updateListing(id, data)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L239-L242).
  8. Cache invalidated across `["my-listings"]`, `["room", id]`, and `["rooms"]`.
  9. Toast confirms: *"Changes saved"*; user returned to `/caretaker/listings`.
- **Alternative Flows**: None.
- **Exceptions**:
  - *E1. Unauthorized access attempt (user is not listing owner)*:
    1. System halts access and renders: *"Room not found. It may have been removed, or it belongs to another account."*
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`.
  - *Written*: `ENT-001 (Room)`.
- **Security/Authorization**: Strict ownership check (`room.caretakerId === user.id`).
- **Related IDs**: `FR-015`, `NFR-SEC-004`, `API-015`, `ENT-001`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/CaretakerEditPage.jsx#L1-L56](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerEditPage.jsx#L1-L56), [src/services/api.js#L239-L242](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L239-L242).

---

#### UC-016: Toggle Room Vacancy Status
- **Primary Actor**: Caretaker.
- **Supporting Actors**: None.
- **Goal**: Quickly toggle a room between "Vacant" and "Taken" with instant feedback and an undo window.
- **Trigger**: Caretaker clicks Vacancy Switch in `/caretaker/listings`.
- **Preconditions**: Caretaker owns listing.
- **Postconditions**: Room status updated; if marked Vacant, `lastConfirmedVacantAt` resets to current timestamp.
- **Main Success Flow**:
  1. Caretaker navigates to `/caretaker/listings`.
  2. Caretaker toggles the Switch next to a listing (e.g., from Vacant to Taken).
  3. System triggers optimistic UI mutation via [`toggle.mutate`](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerListingsPage.jsx#L31-L60), updating local cache immediately.
  4. System calls [`setRoomStatus(room.id, status)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L243-L246).
  5. If status is set to "Vacant", `lastConfirmedVacantAt` is updated to current ISO string.
  6. System shows toast notification: *"Marked as taken"* (or *"Marked as vacant"*) accompanied by an interactive **Undo** action button.
- **Alternative Flows**:
  - *6a. Caretaker clicks "Undo" in toast notification*:
    1. Toast action triggers rollback handler.
    2. Cache and server reset to previous `status` and previous `lastConfirmedVacantAt`.
    3. UI reflects original state.
- **Exceptions**:
  - *E1. Network mutation fails*: Optimistic update reverts; error toast alerts: *"Couldn't update the room. Check your connection and try again."*
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`.
  - *Written*: `ENT-001 (Room.status, Room.lastConfirmedVacantAt)`.
- **Security/Authorization**: Caretaker ownership required.
- **Related IDs**: `FR-016`, `NFR-PERF-001`, `API-016`, `ENT-001`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/CaretakerListingsPage.jsx#L31-L60](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerListingsPage.jsx#L31-L60), [src/services/api.js#L243-L246](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L243-L246).

---

#### UC-017: Reconfirm Stale/Hidden Listing
- **Primary Actor**: Caretaker.
- **Supporting Actors**: None.
- **Goal**: Reconfirm that a room is still vacant after 14 days of inactivity, or restore visibility after an admin quarantine.
- **Trigger**: Caretaker clicks *"Yes, still vacant"* on a flagged listing card.
- **Preconditions**: Listing has `status === "Vacant"` and either `daysSince(lastConfirmedVacantAt) >= 14` or `hidden === true`.
- **Postconditions**: `lastConfirmedVacantAt` reset to today; `hidden` flag set to `false`; listing restored to public search.
- **Main Success Flow**:
  1. Caretaker views `/caretaker/listings`.
  2. System detects listing is stale (>= 14 days unconfirmed) or hidden by an admin.
  3. Listing card renders alert box: *"Still vacant? Last confirmed X days ago. Tap 'Yes, still vacant' below to bring it back."*
  4. Caretaker clicks *"Yes, still vacant"*.
  5. System triggers optimistic cache update.
  6. System invokes [`reconfirmRoom(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L248-L251).
  7. API sets `status: "Vacant"`, updates `lastConfirmedVacantAt: new Date().toISOString()`, and clears `hidden: false`.
  8. Toast confirms: *"Thanks. Confirmed vacant today."*
  9. Warning banner disappears and listing trust score points for freshness are restored.
- **Alternative Flows**: None.
- **Exceptions**:
  - *E1. Network failure*: System rolls back cache and alerts caretaker.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`.
  - *Written*: `ENT-001 (Room.lastConfirmedVacantAt, Room.hidden)`.
- **Security/Authorization**: Caretaker ownership verified.
- **Related IDs**: `FR-017`, `NFR-PERF-001`, `API-017`, `ENT-001`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/CaretakerListingsPage.jsx#L61-L73](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerListingsPage.jsx#L61-L73), [src/services/api.js#L248-L251](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L248-L251).

---

#### UC-018: Delete Own Listing
- **Primary Actor**: Caretaker.
- **Supporting Actors**: None.
- **Goal**: Permanently delete a listing that has been demolished, sold, or decommissioned.
- **Trigger**: Caretaker clicks Trash icon on listing card.
- **Preconditions**: Listing owned by authenticated caretaker.
- **Postconditions**: Listing removed from data store; open reports regarding listing resolved.
- **Main Success Flow**:
  1. Caretaker clicks Trash icon on a listing row in `/caretaker/listings`.
  2. System displays confirmation modal ([`AlertDialog`](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerListingsPage.jsx#L98-L114)): *“Delete this listing? '[Title]' will be removed for good. If it's just rented out, mark it Taken instead.”*
  3. Caretaker clicks *"Delete"*.
  4. System calls [`deleteListing(room.id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L252).
  5. System invalidates queries and clears modal state.
  6. Toast confirms: *"Listing deleted"*.
- **Alternative Flows**:
  - *2a. Caretaker cancels dialog*: Dialog closes without side effects.
- **Exceptions**:
  - *E1. Network failure*: Error toast displayed: *"Couldn't delete the listing. Try again."*
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`.
  - *Written*: `ENT-001 (Room [deleted])`.
- **Security/Authorization**: Listing owner only.
- **Related IDs**: `FR-018`, `NFR-SEC-004`, `API-018`, `ENT-001`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/CaretakerListingsPage.jsx#L74-L114](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerListingsPage.jsx#L74-L114), [src/services/api.js#L252](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L252).

---

#### UC-019: Add Another Room Type to Building
- **Primary Actor**: Caretaker.
- **Supporting Actors**: None.
- **Goal**: Post a different room type within an existing building (e.g. single room in a complex that already has bedsitters) without re-entering building details.
- **Trigger**: Caretaker clicks *"Add another room type"* from `/caretaker/listings`.
- **Preconditions**: Caretaker owns an existing listing in that building.
- **Postconditions**: New room listing created sharing the common `buildingId`; sibling listings linked in detail views.
- **Main Success Flow**:
  1. Caretaker clicks *"Add another room type"* on a listing card.
  2. System navigates to `/caretaker/post?copy=:sourceRoomId`.
  3. System retrieves source listing data via [`getMyListings`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L258-L262).
  4. System prefills building-level attributes: `area`, `depositTerms`, `amenities`, `distances`, `matatuFareKes`, `mapLink`, `whatsappNumber`, and `callNumber`.
  5. Title, description, photos, and rent are left blank for the caretaker to define.
  6. System shows banner: *"Same building as [Title] ([Type]). We've copied the location, contacts and what's included."*
  7. Caretaker selects new room type, inputs rent, uploads room photos, and submits.
  8. System assigns or inherits `buildingId`: `source.buildingId ?? source.id`. If source had no `buildingId`, source is retroactively updated with this ID.
  9. System calls [`createListing`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L233-L238) with shared `buildingId`.
  10. System invalidates building queries; toast confirms: *"Room added to the same building."*
- **Alternative Flows**:
  - *6a. Caretaker wants blank form*: Caretaker clicks *"Start a blank listing"* link; query param is removed and blank form loaded.
- **Exceptions**: None.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Source Room)`.
  - *Written*: `ENT-001 (New Room, Source Room.buildingId)`.
- **Security/Authorization**: Caretaker ownership verified on source listing.
- **Related IDs**: `FR-019`, `NFR-USA-001`, `API-019`, `ENT-001`, `ENT-011`, `TC-BLD-001`.
- **UI Evidence Paths**: [src/pages/CaretakerPostPage.jsx#L28-L54](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerPostPage.jsx#L28-L54), [src/services/api.js#L254-L257](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L254-L257), [src/test/buildings.test.js#L1-L50](file:///e:/Coding_Projects/rommie-webapp/src/test/buildings.test.js#L1-L50).

---

#### UC-020: Submit Caretaker ID Verification
- **Primary Actor**: Caretaker.
- **Supporting Actors**: None.
- **Goal**: Upload National ID or Passport to earn the "Verified Caretaker" trust badge.
- **Trigger**: Caretaker clicks *"Request verification"* on `/caretaker/profile`.
- **Preconditions**: Authenticated caretaker whose status is not yet approved.
- **Postconditions**: `VerificationRequest` record of kind `"caretaker"` added to admin moderation queue.
- **Main Success Flow**:
  1. Caretaker navigates to `/caretaker/profile`.
  2. System displays Verification status card via [`getMyVerification("caretaker")`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L318-L333).
  3. Status is `"none"` or `"rejected"`.
  4. Caretaker attaches a photo or PDF of their Kenyan National ID or Passport (<= 8MB).
  5. Caretaker submits file.
  6. System calls [`submitVerification("caretaker", file)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L297-L316).
  7. System records pending request in `rommie.verification`.
  8. Toast confirms: *"Submitted. We'll review it soon."*
  9. Card updates to pending state explaining that a team member will review the document.
- **Alternative Flows**:
  - *3a. Caretaker already verified*: Card displays *"Verified Caretaker"* badge and explains that students see the badge on all rooms.
- **Exceptions**:
  - *E1. Pending request already in flight*: System prevents duplicate submission.
  - *E2. File exceeds 8 MB or invalid mime*: Error message displayed.
- **Data Read/Written**:
  - *Read*: `ENT-007 (VerificationRequest)`.
  - *Written*: `ENT-007 (VerificationRequest)`.
- **Security/Authorization**: Caretaker role required.
- **Related IDs**: `FR-020`, `NFR-SEC-004`, `API-020`, `ENT-007`, `TC-STU-ADM-001`.
- **UI Evidence Paths**: [src/pages/CaretakerProfilePage.jsx#L62-L80](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerProfilePage.jsx#L62-L80), [src/services/api.js#L296-L333](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L296-L333).

---

#### UC-021: View Trust Score Breakdown
- **Primary Actor**: Caretaker.
- **Supporting Actors**: None.
- **Goal**: Understand how the caretaker's platform trust score is calculated and how to improve it.
- **Trigger**: Caretaker views `/caretaker/profile`.
- **Preconditions**: Authenticated caretaker.
- **Postconditions**: Detailed point breakdown across the 4 trust pillars rendered.
- **Main Success Flow**:
  1. Caretaker visits `/caretaker/profile`.
  2. System fetches profile via [`getCaretakerProfile(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L370-L382).
  3. System evaluates [`computeTrust`](file:///e:/Coding_Projects/rommie-webapp/src/lib/trust.js#L9-L48) across 4 pillars:
     - **Verification (max 35 pts)**: 35 pts if National ID verified by admin; 0 pts if unverified.
     - **Listing Freshness (max 30 pts)**: Proportional to vacant listings confirmed within last 14 days (`STALE_DAYS = 14`).
     - **Reports (max 25 pts)**: Starts at 25 pts; docks 8 pts per report filed on their listings (`Math.max(0, 25 - 8 * reportCount)`).
     - **Account Age (max 10 pts)**: 1 pt per full month on Rommie up to 10 pts (`Math.min(10, months)`).
  4. Total score (0-100) and individual pillar bars rendered in [`TrustScoreCard`](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/TrustScoreCard.jsx).
  5. Caretaker inspects actionable advice for each pillar (e.g., *"Upload your ID"*, *"Reconfirm vacant rooms"*).
- **Alternative Flows**: None.
- **Exceptions**: None.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-003 (Caretaker)`, `ENT-006 (Report)`, `ENT-007 (VerificationRequest)`.
  - *Written*: None.
- **Security/Authorization**: Caretaker access only.
- **Related IDs**: `FR-021`, `NFR-USA-001`, `API-021`, `ENT-003`.
- **UI Evidence Paths**: [src/lib/trust.js#L1-L49](file:///e:/Coding_Projects/rommie-webapp/src/lib/trust.js#L1-L49), [src/components/caretaker/TrustScoreCard.jsx](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/TrustScoreCard.jsx), [src/pages/CaretakerProfilePage.jsx#L59-L61](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerProfilePage.jsx#L59-L61).

---

### 3.3 Admin Use Cases (UC-022 to UC-032)

#### UC-022: View Platform Dashboard
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Monitor platform health through 6 core operational KPIs and triage stale listings.
- **Trigger**: Admin navigates to `/admin`.
- **Preconditions**: Authenticated user with `role === "admin"`.
- **Postconditions**: KPI metrics and stale listings table displayed.
- **Main Success Flow**:
  1. Admin accesses `/admin`.
  2. System enforces [`RequireRole(["admin"])`](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L61-L92).
  3. System calls [`getAdminStats()`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L384-L397).
  4. System computes:
     - `totalListings`: Active listings neither hidden nor suspended.
     - `vacancies`: Active listings currently vacant.
     - `contactsMade`: Total WhatsApp and Call taps on existing listings.
     - `staleListings`: Vacant listings unconfirmed for >= 14 days.
     - `openReports`: Active unresolved abuse reports.
     - `hiddenListings`: Listings quarantined from public view.
  5. System renders 6 KPI summary cards.
  6. System displays table of Stale Listings with filter dropdown (All, Hostels, Rooms/Apartments) showing days since confirmation and quick "Hide" action button.
- **Alternative Flows**: None.
- **Exceptions**:
  - *E1. Non-admin accesses page*: Guard halts rendering and shows *"This page isn't for your account"*.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-006 (Report)`, `ENT-008 (ContactEvent)`.
  - *Written*: None.
- **Security/Authorization**: Strict `admin` role authorization.
- **Related IDs**: `FR-022`, `NFR-PERF-001`, `API-022`, `ENT-001`, `ENT-006`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/AdminDashboardPage.jsx#L1-L138](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminDashboardPage.jsx#L1-L138), [src/services/api.js#L384-L397](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L384-L397).

---

#### UC-023: Hide Stale Listings
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Quarantine an unconfirmed stale listing from public search to preserve search quality.
- **Trigger**: Admin clicks *"Hide"* on a stale listing row in `/admin` or `/admin/listings`.
- **Preconditions**: Authenticated admin; target room exists and is currently visible.
- **Postconditions**: Listing set to `hidden: true`; removed from student search; audit log entry recorded.
- **Main Success Flow**:
  1. Admin clicks *"Hide"* on a stale listing.
  2. System opens confirmation dialog: *“Hide this listing? '[Title]' will disappear from search and room pages. [Caretaker] will still see it in My Listings.”*
  3. Admin confirms action.
  4. System calls [`hideListing(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L399-L405).
  5. System sets `room.hidden = true`.
  6. System creates audit log entry `listing.hidden` via [`logAction`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L86-L91).
  7. Toast confirms: *"Listing hidden"*.
  8. Queries refreshed across stats, listings, and public search.
- **Alternative Flows**: None.
- **Exceptions**: None.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`.
  - *Written*: `ENT-001 (Room.hidden)`, `ENT-009 (ActivityEntry)`.
- **Security/Authorization**: Admin only.
- **Related IDs**: `FR-023`, `NFR-OBS-001`, `API-023`, `ENT-001`, `ENT-009`, `TC-ADM-LST-001`.
- **UI Evidence Paths**: [src/pages/AdminDashboardPage.jsx#L28-L36](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminDashboardPage.jsx#L28-L36), [src/services/api.js#L399-L405](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L399-L405).

---

#### UC-024: Restore Hidden Listings
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Re-enable a quarantined listing on the public site after caretaker verification.
- **Trigger**: Admin clicks *"Restore"* in the Hidden Listings section of `/admin` or `/admin/listings`.
- **Preconditions**: Listing has `hidden === true`.
- **Postconditions**: Listing has `hidden === false`; listing visible in public search; audit log recorded.
- **Main Success Flow**:
  1. Admin navigates to `/admin` or `/admin/listings`.
  2. Admin locates quarantined listing and clicks *"Restore"*.
  3. System calls [`restoreListing(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L413-L423).
  4. System verifies listing is currently hidden.
  5. System sets `room.hidden = false`.
  6. System creates audit log entry `listing.restored`.
  7. Toast confirms: *"Listing restored"*.
  8. Listing reappears in public search (if it is still stale, it displays "Needs reconfirming" tag).
- **Alternative Flows**: None.
- **Exceptions**:
  - *E1. Listing is not hidden*: System rejects call with: *"That listing isn't hidden."*
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`.
  - *Written*: `ENT-001 (Room.hidden)`, `ENT-009 (ActivityEntry)`.
- **Security/Authorization**: Admin only.
- **Related IDs**: `FR-024`, `NFR-OBS-001`, `API-024`, `ENT-001`, `ENT-009`, `TC-ADM-LST-001`.
- **UI Evidence Paths**: [src/pages/AdminDashboardPage.jsx#L37-L44](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminDashboardPage.jsx#L37-L44), [src/services/api.js#L413-L423](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L413-L423).

---

#### UC-025: Manage All Listings
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Oversee every platform listing, filter by visibility/status, modify inaccurate fields, or delete spam.
- **Trigger**: Admin accesses `/admin/listings`.
- **Preconditions**: Authenticated admin.
- **Postconditions**: Direct listing modifications or permanent deletions persisted; audit log updated.
- **Main Success Flow**:
  1. Admin visits `/admin/listings`.
  2. System invokes [`getAdminListings()`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L426-L433) returning all rooms sorted newest first with aggregated contact counts.
  3. Admin filters listings using search text, room type, area, vacancy status, visibility (visible vs hidden), or "Stale only" checkbox.
  4. Admin clicks *"Edit"* on a listing.
  5. System opens [`EditDialog`](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminListingsPage.jsx#L155-L160) allowing edits to Title (5-80 chars), Description (<= 600 chars), and Monthly Rent in KES (excluding hostels where rent derives from room options).
  6. Admin submits modifications.
  7. System invokes [`adminUpdateListing(id, data)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L435-L473).
  8. System records audit log entry `listing.edited` detailing changed fields.
  9. Toast confirms update; table updates.
- **Alternative Flows**:
  - *4a. Admin deletes listing (Spam/Duplicate)*:
    1. Admin clicks *"Delete"*.
    2. Confirmation modal warns: *“Delete this listing? '[Title]' will be removed for good and its open reports closed. This can't be undone.”*
    3. Admin confirms.
    4. System calls [`adminDeleteListing(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L474-L486).
    5. Listing removed; any open reports associated with the room are marked `status: "resolved", action: "deleted"`.
    6. Audit log entry `listing.deleted` logged.
- **Exceptions**:
  - *E1. Attempt to edit rent on a hostel listing*: System blocks edit with error: *"Rent for hostels comes from the room options. Ask the caretaker to edit those."*
  - *E2. Title length out of bounds (< 5 or > 80 chars)*: Validation error returned.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-008 (ContactEvent)`.
  - *Written*: `ENT-001 (Room)`, `ENT-006 (Report)`, `ENT-009 (ActivityEntry)`.
- **Security/Authorization**: Admin only.
- **Related IDs**: `FR-025`, `NFR-SEC-004`, `API-025`, `ENT-001`, `ENT-006`, `ENT-009`, `TC-ADM-LST-001`.
- **UI Evidence Paths**: [src/pages/AdminListingsPage.jsx#L1-L160](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminListingsPage.jsx#L1-L160), [src/services/api.js#L426-L486](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L426-L486), [src/test/admin-listings.test.js#L1-L80](file:///e:/Coding_Projects/rommie-webapp/src/test/admin-listings.test.js#L1-L80).

---

#### UC-026: Review User Reports
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Moderate reported listings by dismissing baseless flags, marking resolved, or quarantining bad listings.
- **Trigger**: Admin navigates to `/admin/reports`.
- **Preconditions**: Authenticated admin.
- **Postconditions**: Report decision saved; if hidden, listing is quarantined and sibling reports resolved; audit log updated.
- **Main Success Flow**:
  1. Admin opens `/admin/reports`.
  2. System loads reports via [`getReports("open")`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L593-L608), displaying flagged reason, room title, caretaker, student notes, and duplicate report count.
  3. Admin reviews report.
  4. Admin selects action:
     - **Dismiss**: Report is unfounded.
     - **Mark Resolved**: Caretaker rectified issue (e.g., corrected price).
     - **Hide Listing**: Listing is deceptive, unavailable, or abusive.
  5. Admin clicks *"Hide listing"*.
  6. Confirmation dialog confirms quarantine.
  7. System executes [`reviewReport(id, "hidden")`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L613-L635).
  8. System sets `room.hidden = true` and resolves ALL open reports filed on that specific room with `action: "hidden"`.
  9. System records audit log `listing.hidden` citing the triggering report reason.
  10. Toast confirms; report card shifts to "Handled" tab.
- **Alternative Flows**:
  - *4a. Admin selects "Dismiss" or "Resolved"*:
    1. System calls [`reviewReport(id, decision)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L613-L635).
    2. Single report updated with `status: decision, action: decision, handledAt, handledBy`.
    3. Logged to admin activity log.
- **Exceptions**:
  - *E1. Report already handled*: System rejects action with: *"That report was already handled."*
- **Data Read/Written**:
  - *Read*: `ENT-006 (Report)`, `ENT-001 (Room)`.
  - *Written*: `ENT-006 (Report)`, `ENT-001 (Room.hidden)`, `ENT-009 (ActivityEntry)`.
- **Security/Authorization**: Admin only.
- **Related IDs**: `FR-026`, `NFR-SEC-004`, `API-026`, `ENT-006`, `ENT-001`, `ENT-009`, `TC-ADM-REP-001`.
- **UI Evidence Paths**: [src/pages/AdminReportsPage.jsx#L1-L102](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminReportsPage.jsx#L1-L102), [src/services/api.js#L593-L635](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L593-L635), [src/test/admin-reports.test.js#L1-L75](file:///e:/Coding_Projects/rommie-webapp/src/test/admin-reports.test.js#L1-L75).

---

#### UC-027: Manage Users
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Audit registered users, inspect trust scores, and suspend fraudulent caretakers.
- **Trigger**: Admin accesses `/admin/users`.
- **Preconditions**: Authenticated admin.
- **Postconditions**: Caretaker suspension state toggled; listings visibility adjusted; audit log entry recorded.
- **Main Success Flow**:
  1. Admin navigates to `/admin/users`.
  2. System loads user catalog via [`getAdminUsers()`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L490-L508), separating Caretakers/Hostels and Students.
  3. Caretaker cards display: Name, Phone, Joined Date, Verified badge, Trust Score, Active Listing Count, and Open Report Count.
  4. Admin identifies suspicious caretaker and clicks *"Suspend"*.
  5. Confirmation dialog explains: *“Suspend [Name]? Their X listings leave the public site and they can't log in. You can restore them at any time.”*
  6. Admin confirms suspension.
  7. System invokes [`setCaretakerSuspended(id, true)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L510-L525).
  8. System records ID in `rommie.suspended` registry.
  9. System creates audit log entry `caretaker.suspended`.
  10. Toast confirms: *"[Name] suspended"*. Caretaker's listings immediately vanish from public search results and caretaker is barred from logging in.
- **Alternative Flows**:
  - *4a. Admin restores a suspended caretaker*:
    1. Admin clicks *"Restore"* on suspended caretaker card.
    2. System calls [`setCaretakerSuspended(id, false)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L510-L525).
    3. ID removed from suspension set; audit log `caretaker.restored` generated; caretaker listings reappear in public search.
- **Exceptions**: None.
- **Data Read/Written**:
  - *Read*: `ENT-002 (User)`, `ENT-003 (Caretaker)`, `rommie.suspended`.
  - *Written*: `rommie.suspended`, `ENT-009 (ActivityEntry)`.
- **Security/Authorization**: Admin only.
- **Related IDs**: `FR-027`, `NFR-SEC-004`, `API-027`, `ENT-002`, `ENT-003`, `ENT-009`, `TC-ADM-USR-001`.
- **UI Evidence Paths**: [src/pages/AdminUsersPage.jsx#L1-L120](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminUsersPage.jsx#L1-L120), [src/services/api.js#L490-L525](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L490-L525), [src/test/admin-users.test.js#L1-L60](file:///e:/Coding_Projects/rommie-webapp/src/test/admin-users.test.js#L1-L60).

---

#### UC-028: Review Verification Queue (Caretaker KYC)
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Inspect uploaded caretaker identity documents (National ID or Passport) and approve or reject KYC verification requests.
- **Trigger**: Admin navigates to `/admin/verification`.
- **Preconditions**: Authenticated admin.
- **Postconditions**: Request status updated to `"approved"` or `"rejected"`; caretaker verified badge and trust score updated; audit log entry recorded.
- **Scope Note**: Following Alvan's design review, the "Students" tab and student verification badge step have been removed. The verification queue operates exclusively for Caretakers and Landlords to prevent rental deposit fraud.
- **Main Success Flow**:
  1. Admin opens `/admin/verification`.
  2. System calls [`getVerificationQueue()`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L334-L340) returning pending caretaker requests sorted oldest-first.
  3. Admin views the queue of pending Caretakers & Landlords.
  4. Admin clicks *"View [documentName]"* on a pending request.
  5. System opens [`DocumentViewer`](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminVerificationPage.jsx#L101-L117) dialog, rendering inline preview for images or an iframe for PDFs, with an *"Open in a new tab"* external link.
  6. Admin verifies caretaker National ID / Passport authenticity against name and details.
  7. Admin clicks *"Approve"*.
  8. System calls [`reviewVerification(id, "approved")`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L341-L350).
  9. System sets request status to `"approved"`, records `reviewedAt` and `reviewedBy: admin.name`.
  10. System creates audit log entry `verification.approved`.
  11. Caretaker record updated to `verified: true`, system awards +35 trust score points, and all caretaker listings immediately display the Verified Caretaker badge.
  12. Toast confirms: *"Approved [Name]"*.
- **Alternative Flows**:
  - *7a. Admin rejects request*:
    1. Admin clicks *"Reject"*.
    2. Rejection dialog mandates an explanation note (e.g., *"Photo is blurry; please re-upload clear photo of National ID"*).
    3. Admin confirms rejection.
    4. System calls [`reviewVerification(id, "rejected", note)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L341-L350).
    5. Request marked `rejected`; note persisted; audit log `verification.rejected` recorded; caretaker can re-upload.
- **Exceptions**:
  - *E1. Rejection attempted without a reason*: System blocks submission: *"Add a reason so they know what to fix."*
- **Data Read/Written**:
  - *Read*: `ENT-008 (VerificationRequest)`, `ENT-003 (Caretaker)`.
  - *Written*: `ENT-008 (VerificationRequest)`, `ENT-003 (Caretaker)`, `ENT-009 (ActivityLog)`.
- **Security/Authorization**: Strict `admin` role guard.
- **Related IDs**: `FR-027`, `NFR-SEC-004`, `API-032`, `API-033`, `ENT-008`, `TC-STU-ADM-001`.
- **UI Evidence Paths**: [src/pages/AdminVerificationPage.jsx#L1-L135](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminVerificationPage.jsx#L1-L135), [src/services/api.js#L334-L350](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L334-L350).

---

#### UC-029: Undo Verification Decision
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Revert an accidental approval or rejection back to the pending queue for re-evaluation.
- **Trigger**: Admin clicks *"Undo"* on a row in the "History" tab of `/admin/verification`.
- **Preconditions**: Target request has status `"approved"` or `"rejected"`.
- **Postconditions**: Request status reset to `"pending"`; reviewer details and reasons wiped; awarded badges rescinded; audit log entry logged.
- **Main Success Flow**:
  1. Admin opens `/admin/verification` and selects the "History" tab.
  2. System loads reviewed requests via [`getVerificationHistory()`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L352-L358), sorted newest first.
  3. Admin locates erroneous decision and clicks *"Undo"*.
  4. System calls [`undoVerificationReview(id)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L360-L369).
  5. System resets request `status: "pending"`, `reason: undefined`, `reviewedAt: undefined`, `reviewedBy: undefined`.
  6. Any associated verification badge is immediately revoked until re-approved.
  7. System records audit log entry `verification.undone`.
  8. Toast confirms: *"[Name] is back in the queue"*.
- **Alternative Flows**: None.
- **Exceptions**:
  - *E1. Request is already pending*: System throws error: *"That request is already waiting for review."*
- **Data Read/Written**:
  - *Read*: `ENT-007 (VerificationRequest)`.
  - *Written*: `ENT-007 (VerificationRequest)`, `ENT-009 (ActivityEntry)`.
- **Security/Authorization**: Admin only.
- **Related IDs**: `FR-029`, `NFR-SEC-004`, `API-029`, `ENT-007`, `ENT-009`, `TC-STU-ADM-001`.
- **UI Evidence Paths**: [src/pages/AdminVerificationPage.jsx#L38-L46](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminVerificationPage.jsx#L38-L46), [src/services/api.js#L360-L369](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L360-L369).

---

#### UC-030: View Admin Activity Log
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Inspect a tamper-evident chronological audit trail of all moderation actions executed on the platform.
- **Trigger**: Admin navigates to `/admin/activity`.
- **Preconditions**: Authenticated admin.
- **Postconditions**: Activity log rendered, filtered by category.
- **Main Success Flow**:
  1. Admin visits `/admin/activity`.
  2. System queries [`getActivity(limit = 200)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L92-L96) returning the last 500 actions recorded in `rommie.activity`.
  3. Admin selects category filter: All activity, Listings (`listing.*`), Reports (`report.*`), Verifications (`verification.*`), Users (`caretaker.*`), or Settings (`settings.*`).
  4. System filters entries via [`filterActivity`](file:///e:/Coding_Projects/rommie-webapp/src/lib/adminFilters.js).
  5. Each item renders human-readable summary, actor name, and localized timestamp (e.g., *"19 Oct, 02:15"*).
  6. Admin clicks *"Show more"* to paginate through older log entries.
- **Alternative Flows**: None.
- **Exceptions**: None.
- **Data Read/Written**:
  - *Read*: `ENT-009 (ActivityEntry)`.
  - *Written*: None.
- **Security/Authorization**: Strict admin access.
- **Related IDs**: `FR-030`, `NFR-OBS-001`, `API-030`, `ENT-009`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/AdminActivityPage.jsx#L1-L49](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminActivityPage.jsx#L1-L49), [src/services/api.js#L80-L96](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L80-L96).

---

#### UC-031: View Platform Analytics
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Review operational platform metrics, listing distributions, contact inquiry trends, and caretaker growth.
- **Trigger**: Admin navigates to `/admin/analytics`.
- **Preconditions**: Authenticated admin.
- **Postconditions**: Analytics visual charts and ranking lists rendered.
- **Main Success Flow**:
  1. Admin navigates to `/admin/analytics`.
  2. System invokes [`getAdminAnalytics()`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L549-L592).
  3. System aggregates metrics:
     - Listings by Area: Horizontal bar chart showing total and vacant counts per area.
     - Listings by Type: Breakdown across bedsitters, single rooms, one bedrooms, and hostels.
     - Platform Vacancy Rate: Overall percentage of live listings that are currently vacant.
     - 14-Day Inquiries Trend: Daily breakdown of WhatsApp and Call contact taps over the past 14 days.
     - Top 5 Most Contacted Listings: Ranking of properties receiving the highest tenant contact taps.
     - 8-Week Caretaker Signups: Weekly onboarding cadence of new caretakers over the last 8 weeks.
  4. System renders high-contrast, accessible horizontal bar charts ([`Bars`](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminAnalyticsPage.jsx#L19-L28)) where numerical values are explicitly stated in text so color is never the sole carrier of meaning.
- **Alternative Flows**: None.
- **Exceptions**: None.
- **Data Read/Written**:
  - *Read*: `ENT-001 (Room)`, `ENT-003 (Caretaker)`, `ENT-008 (ContactEvent)`.
  - *Written*: None.
- **Security/Authorization**: Admin only. Excludes quarantined and suspended listings from aggregates.
- **Related IDs**: `FR-031`, `NFR-USA-002`, `API-031`, `ENT-001`, `ENT-008`, `TC-ROUT-001`.
- **UI Evidence Paths**: [src/pages/AdminAnalyticsPage.jsx#L1-L67](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminAnalyticsPage.jsx#L1-L67), [src/services/api.js#L549-L592](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L549-L592).

---

#### UC-032: Update Site Settings
- **Primary Actor**: Admin.
- **Supporting Actors**: None.
- **Goal**: Update global support contact numbers, help email, business hours, and operational location.
- **Trigger**: Admin navigates to `/admin/settings`.
- **Preconditions**: Authenticated admin.
- **Postconditions**: New settings persisted; footer and help pages reflect updated details; audit log recorded.
- **Main Success Flow**:
  1. Admin opens `/admin/settings`.
  2. System loads current settings via [`getSettings()`](file:///e:/Coding_Projects/rommie-webapp/src/lib/settings.js): WhatsApp number, Phone number, Support email, Support hours, and Based-in location.
  3. Admin modifies one or more fields.
  4. Admin submits form.
  5. System validates inputs via [`validateSettings`](file:///e:/Coding_Projects/rommie-webapp/src/lib/settings.js) (ensuring valid email format and Kenyan phone structure).
  6. System invokes [`updateSiteSettings(input)`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L527-L545).
  7. System persists changes to `rommie.settings`.
  8. System logs audit entry `settings.updated` detailing which fields changed.
  9. Toast confirms: *"Settings saved. The footer and help pages now show these details."*
- **Alternative Flows**:
  - *3a. Admin resets to platform defaults*: Admin clicks *"Reset to defaults"*; form restores initial seed constants.
- **Exceptions**:
  - *E1. Validation failure (e.g. invalid email syntax)*: System highlights error on input and blocks save.
- **Data Read/Written**:
  - *Read*: `ENT-010 (SiteSettings)`.
  - *Written*: `ENT-010 (SiteSettings)`, `ENT-009 (ActivityEntry)`.
- **Security/Authorization**: Admin only.
- **Related IDs**: `FR-032`, `NFR-SEC-004`, `API-032`, `ENT-010`, `ENT-009`, `TC-ADM-SET-001`.
- **UI Evidence Paths**: [src/pages/AdminSettingsPage.jsx#L1-L65](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminSettingsPage.jsx#L1-L65), [src/lib/settings.js](file:///e:/Coding_Projects/rommie-webapp/src/lib/settings.js), [src/services/api.js#L527-L545](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L527-L545), [src/test/admin-settings.test.js#L1-L45](file:///e:/Coding_Projects/rommie-webapp/src/test/admin-settings.test.js#L1-L45).

---

### 3.4 System & Client Use Cases (UC-033 to UC-035)

#### UC-033: Cross-Tab Session Sync
- **Primary Actor**: System / Browser Runtime.
- **Supporting Actors**: Human User.
- **Goal**: Synchronize login, logout, and verification badge updates across all open browser tabs in real time without page reload.
- **Trigger**: `window.localStorage` mutation event on key `rommie.session`.
- **Preconditions**: Browser tab is open with application active.
- **Postconditions**: In-memory React state and external store listener updated across all tabs.
- **Main Success Flow**:
  1. User logs in or logs out in Browser Tab A.
  2. Tab A writes or removes `rommie.session` in `window.localStorage`.
  3. Browser dispatches native `storage` event to Browser Tab B.
  4. [`subscribeSession`](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L681-L694) in Tab B receives event for `SESSION_KEY`.
  5. System reloads session snapshot into memory via `loadSession()`.
  6. Active React `useSyncExternalStore` hook triggers re-render of authenticated state in [`useAuth`](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L8-L12).
  7. Protected navigation guards re-evaluate immediately without requiring a full browser refresh.
- **Alternative Flows**: None.
- **Exceptions**: None.
- **Data Read/Written**:
  - *Read*: `window.localStorage (rommie.session)`.
  - *Written*: In-memory session reference.
- **Security/Authorization**: Same-origin browser security policy.
- **Related IDs**: `FR-033`, `NFR-SEC-003`, `API-033`, `ENT-002`, `TC-AUTH-001`.
- **UI Evidence Paths**: [src/services/api.js#L681-L694](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L681-L694), [src/lib/auth.jsx#L8-L12](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L8-L12).

---

#### UC-034: Offline Detection
- **Primary Actor**: System / Network Stack.
- **Supporting Actors**: Human User.
- **Goal**: Warn users immediately when their internet connectivity drops so they do not misinterpret stale or cached screens.
- **Trigger**: Browser emits `window` `"offline"` or `"online"` event.
- **Preconditions**: Web application running in browser.
- **Postconditions**: Global top notification banner dynamically toggles visibility.
- **Main Success Flow**:
  1. Client device loses cellular data or WiFi connectivity.
  2. Browser fires native `offline` event.
  3. [`useSyncExternalStore`](file:///e:/Coding_Projects/rommie-webapp/src/components/OfflineBanner.jsx#L13) in [`OfflineBanner`](file:///e:/Coding_Projects/rommie-webapp/src/components/OfflineBanner.jsx) reads `navigator.onLine === false`.
  4. System immediately displays fixed status banner below header: *“You're offline. Some things may not load until you're back online.”* with `WifiOff` icon.
  5. Device regains internet access; browser fires `online` event.
  6. System detects `navigator.onLine === true` and automatically unmounts the warning banner.
- **Alternative Flows**: None.
- **Exceptions**: None.
- **Data Read/Written**:
  - *Read*: `navigator.onLine`.
  - *Written*: None.
- **Security/Authorization**: Open client utility.
- **Related IDs**: `FR-034`, `NFR-AVAIL-003`, `API-034`.
- **UI Evidence Paths**: [src/components/OfflineBanner.jsx#L1-L20](file:///e:/Coding_Projects/rommie-webapp/src/components/OfflineBanner.jsx#L1-L20).

---

#### UC-035: Client-Side Image Compression
- **Primary Actor**: System / HTML5 Canvas Runtime.
- **Supporting Actors**: Caretaker (uploading photos).
- **Goal**: Downscale large camera images and re-encode as JPEG before transmission to reduce mobile data consumption and network latency.
- **Trigger**: Caretaker selects image files via camera capture or file picker in `PhotoUploader`.
- **Preconditions**: Selected file is of type `image/*`.
- **Postconditions**: Compressed `File` instance produced with maximum dimension <= 1600px and JPEG quality 0.82.
- **Main Success Flow**:
  1. Caretaker attaches a 12 MB high-resolution camera photo.
  2. [`PhotoUploader`](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/PhotoUploader.jsx#L16) invokes [`compressImage(file, maxSide = 1600, quality = 0.82)`](file:///e:/Coding_Projects/rommie-webapp/src/lib/image.js#L2-L21).
  3. System creates bitmap via `createImageBitmap(file)`.
  4. System calculates downscale ratio: `scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))`.
  5. System creates an in-memory HTML5 Canvas and renders scaled image into 2D context.
  6. Bitmap memory is explicitly closed via `bmp.close()`.
  7. Canvas converts image to Blob using `image/jpeg` at quality `0.82`.
  8. If compressed blob size is smaller than original file, system returns newly packaged `File` instance with `.jpg` extension.
  9. Downscaled image is forwarded to upload service.
- **Alternative Flows**:
  - *8a. Compressed blob is larger than original (e.g. already optimized SVG or tiny PNG)*: System detects `blob.size >= file.size` and forwards original file without modification.
- **Exceptions**:
  - *E1. Canvas or createImageBitmap unsupported or throws error*: Catch-block swallows exception and gracefully falls back to the original unmodified file.
- **Data Read/Written**:
  - *Read*: Raw input image file buffer.
  - *Written*: Optimized JPEG `File` object.
- **Security/Authorization**: Client-side execution.
- **Related IDs**: `FR-035`, `NFR-PERF-003`, `API-035`, `TC-BLD-001`.
- **UI Evidence Paths**: [src/lib/image.js#L1-L22](file:///e:/Coding_Projects/rommie-webapp/src/lib/image.js#L1-L22), [src/components/caretaker/PhotoUploader.jsx#L16](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/PhotoUploader.jsx#L16).

---

## 4. User Story Specifications (US-001 to US-035)

---

### 4.1 Student User Stories

#### US-001: Multi-Criteria Accommodation Search
> **As a** student attending a university in Karen or Rongai,  
> **I want** to search and filter vacant accommodations by area, rent ceiling, room type, amenities, and campus commute times,  
> **So that** I can rapidly identify housing options that match my financial constraints and academic timetable.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Filtering by area and maximum rent**:
    - **Given** I am on the `/rooms` discovery page,
    - **When** I click the "Rongai" area chip and enter "8000" into the maximum rent input,
    - **Then** the URL updates to include `?area=Rongai&maxRent=8000`, and all visible room cards show rent <= 8,000 KES in Rongai.
  - **Scenario 2: Excluding taken and quarantined listings**:
    - **Given** a listing is marked "Taken" or has been hidden by an administrator,
    - **When** I search with default settings (`vacantOnly: true`),
    - **Then** that listing must not appear in the search results grid.
  - **Scenario 3: Zero matching results**:
    - **Given** no properties match my selected filter combination,
    - **When** the query resolves,
    - **Then** the page displays *"No rooms match yet"* with a direct CTA to *"Create a vacancy alert"*.
- **Dependencies & Edge Cases**: Requires PostGIS spatial indexing for backend; handle non-numeric rent query strings safely.
- **Traceability**: `UC-001`, `FR-001`, `NFR-PERF-001`, `API-001`, `ENT-001`, `TC-ROUT-001`.
- **Evidence**: [src/pages/RoomsPage.jsx#L17-L147](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomsPage.jsx#L17-L147).

---

#### US-002: Property Inspection & Caretaker Trust Verification
> **As a** student seeking reliable accommodation,  
> **I want** to view high-resolution property photos, campus walking/matatu times, deposit terms, and the caretaker's trust score,  
> **So that** I can evaluate accommodation quality and avoid rental scammers before committing to a physical visit.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Inspecting property details and photos**:
    - **Given** I click on a valid room listing card,
    - **When** the `/rooms/:id` page loads,
    - **Then** I see the full photo gallery, exact rent in KES, deposit terms, amenity list, and commute times to KSL, JKUAT, Tangaza, CUEA, and Co-op.
  - **Scenario 2: Caretaker trust evaluation**:
    - **Given** the room belongs to an approved caretaker,
    - **When** I view the "Your caretaker" section,
    - **Then** I see their overall trust score (0-100) and a verified badge if their National ID was vetted by staff.
  - **Scenario 3: Sibling rooms in building**:
    - **Given** other rooms exist in the same building with the same `buildingId`,
    - **When** I scroll to "Other rooms in this building",
    - **Then** I see sibling room types with thumbnail, type label, vacancy status, and rent.
- **Dependencies & Edge Cases**: Lightbox must support keyboard arrow navigation and touch swipes; non-existent rooms must show 404 state.
- **Traceability**: `UC-002`, `FR-002`, `NFR-PERF-003`, `API-002`, `ENT-001`, `ENT-003`, `TC-HST-001`.
- **Evidence**: [src/pages/RoomDetailPage.jsx#L1-L292](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomDetailPage.jsx#L1-L292).

---

#### US-003: Direct Caretaker Contact via WhatsApp and Phone
> **As a** student ready to book a viewing,  
> **I want** to initiate contact with the caretaker via WhatsApp deep link or direct telephone call,  
> **So that** I can immediately clarify vacancy details and schedule a walkthrough.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Initiating WhatsApp conversation**:
    - **Given** I am on a room detail page,
    - **When** I click the "WhatsApp" button,
    - **Then** the application launches `https://wa.me/<caretaker_phone>` with a pre-filled room inquiry message, and system fires a contact tracking event.
  - **Scenario 2: Deduplicating repeated taps within 30 seconds**:
    - **Given** I click the "WhatsApp" button twice within 10 seconds,
    - **When** telemetry executes,
    - **Then** only one contact event is recorded in the platform metrics.
- **Dependencies & Edge Cases**: WhatsApp format requires country code without leading plus (`254...`).
- **Traceability**: `UC-003`, `FR-003`, `NFR-INT-003`, `API-003`, `ENT-008`, `TC-CON-001`, `TC-CON-002`.
- **Evidence**: [src/services/api.js#L59-L77](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L59-L77), [src/pages/RoomDetailPage.jsx#L264-L265](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomDetailPage.jsx#L264-L265).

---

#### US-004: Saving Favorite Accommodations
> **As a** registered student,  
> **I want** to save interesting listings to a personal shortlist,  
> **So that** I can compare rooms later without having to search for them again.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Authenticated student saving a room**:
    - **Given** I am logged in with role `student`,
    - **When** I click the Heart icon on a room card,
    - **Then** the heart immediately fills red (optimistic update), toast confirms *"Saved to your rooms"*, and the room appears on `/saved`.
  - **Scenario 2: Anonymous visitor attempt to save**:
    - **Given** I am not logged in,
    - **When** I tap the Heart icon,
    - **Then** a toast prompts *"Log in to save rooms."* and I am redirected to `/login?redirect=/current/page`.
- **Dependencies & Edge Cases**: Caretakers and admins must be blocked from saving with an explanatory message.
- **Traceability**: `UC-004`, `FR-004`, `NFR-USA-001`, `API-004`, `ENT-004`, `TC-ROUT-001`.
- **Evidence**: [src/lib/saved.js#L1-L49](file:///e:/Coding_Projects/rommie-webapp/src/lib/saved.js#L1-L49), [src/pages/SavedPage.jsx#L1-L41](file:///e:/Coding_Projects/rommie-webapp/src/pages/SavedPage.jsx#L1-L41).

---

#### US-005: SMS Vacancy Alerts for High-Demand Zones
> **As a** student seeking accommodation in tight rental markets,  
> **I want** to create customized vacancy alert subscriptions,  
> **So that** I receive an immediate SMS notification the moment a matching room becomes vacant.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Creating an alert subscription**:
    - **Given** I am on `/alerts`,
    - **When** I select Area "Gataka", Room Type "bedsitter", Max Rent "6500" and submit,
    - **Then** system saves alert with `active: true` and confirms *"Alert created. We'll text you when a match opens."*
  - **Scenario 2: Pausing and resuming an alert**:
    - **Given** an existing active alert,
    - **When** I toggle the alert Switch to off,
    - **Then** alert status updates to "Paused" and no SMS will be triggered until resumed.
- **Dependencies & Edge Cases**: User must have a verified phone number; requires integration with Kenyan SMS Gateway (Africa's Talking / Twilio).
- **Traceability**: `UC-005`, `FR-005`, `NFR-PERF-001`, `API-005`, `ENT-005`.
- **Evidence**: [src/pages/AlertsPage.jsx#L1-L156](file:///e:/Coding_Projects/rommie-webapp/src/pages/AlertsPage.jsx#L1-L156), [src/services/api.js#L209-L232](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L209-L232).

---

#### US-006: Student Registration with Campus Affiliation
> **As a** prospective student tenant,  
> **I want** to register an account by providing my name, university, phone number, and password,  
> **So that** I can unlock saving favorites, creating alerts, and verifying my student identity.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Successful registration**:
    - **Given** I am on `/signup`,
    - **When** I enter valid names, select my campus from the 5 partner schools, input a valid Kenyan phone (`0712 345 678`), email, and 8+ character password,
    - **Then** account is created with `role: "student"` and I am redirected to `/verify-phone`.
  - **Scenario 2: Selecting "Other" school**:
    - **Given** I study at an institution not in the default 5,
    - **When** I select "Other" from the school dropdown,
    - **Then** a required text input appears prompting for the custom school name.
- **Dependencies & Edge Cases**: Kenyan phone normalization handles leading `07`, `01`, `254`, or `+254`.
- **Traceability**: `UC-006`, `FR-006`, `NFR-SEC-003`, `API-006`, `ENT-002`, `TC-AUTH-001`, `TC-FMT-001`.
- **Evidence**: [src/components/auth/SignupForm.jsx#L1-L123](file:///e:/Coding_Projects/rommie-webapp/src/components/auth/SignupForm.jsx#L1-L123).

---

#### US-007: Unified Role-Aware Authentication
> **As a** registered Rommie user,  
> **I want** to log in securely using my email and password or Google OAuth,  
> **So that** I am authenticated and automatically routed to my role's designated workspace.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Student login routing**:
    - **Given** valid student credentials,
    - **When** I submit the login form,
    - **Then** I am authenticated and routed to `/rooms` (or my pre-login redirect path).
  - **Scenario 2: Caretaker login routing**:
    - **Given** valid caretaker credentials,
    - **When** I log in,
    - **Then** I am routed to `/caretaker/listings`.
  - **Scenario 3: Open redirect prevention**:
    - **Given** a login URL with `?redirect=//evil.com`,
    - **When** login succeeds,
    - **Then** system sanitizes redirect using `safeRedirect` and falls back to role home.
- **Dependencies & Edge Cases**: Suspended caretakers must be rejected during the login step.
- **Traceability**: `UC-007`, `FR-007`, `NFR-SEC-003`, `API-007`, `ENT-002`, `TC-AUTH-001`, `TC-ROUT-001`.
- **Evidence**: [src/components/auth/LoginForm.jsx#L1-L68](file:///e:/Coding_Projects/rommie-webapp/src/components/auth/LoginForm.jsx#L1-L68), [src/lib/auth.jsx#L13-L35](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L13-L35).

---

#### US-008: Mobile Phone Number Verification
> **As a** newly registered user,  
> **I want** to verify my phone number by submitting a 6-digit SMS OTP,  
> **So that** the platform confirms my contact validity and protects against automated bot accounts.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Successful OTP verification**:
    - **Given** I am on `/verify-phone`,
    - **When** I input the 6-digit code received via SMS within 5 minutes,
    - **Then** system marks `user.emailVerified = true` and navigates me forward.
  - **Scenario 2: Code expiration**:
    - **Given** an OTP was issued more than 5 minutes ago,
    - **When** I submit the code,
    - **Then** system displays *"That code has expired. Request a new one."*
- **Dependencies & Edge Cases**: Demo environment accepts `123456`; resend code button disabled during 60-second cooldown.
- **Traceability**: `UC-008`, `FR-008`, `NFR-SEC-002`, `API-008`, `ENT-002`, `TC-AUTH-001`.
- **Evidence**: [src/pages/VerifyPhonePage.jsx#L1-L132](file:///e:/Coding_Projects/rommie-webapp/src/pages/VerifyPhonePage.jsx#L1-L132).

---

#### US-009: Student Identity Verification Upload
> **As an** enrolled university student,  
> **I want** to upload a photo of my Student ID or Admission Letter,  
> **So that** Rommie staff can verify my enrollment and grant me a Verified Student badge.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Submitting ID document**:
    - **Given** I am on `/verify-student` with no pending request,
    - **When** I upload a clear photo or PDF of my student card (<= 8 MB) and submit,
    - **Then** request enters `"pending"` state and displays step progress timeline.
  - **Scenario 2: Duplicate submission prevention**:
    - **Given** I already have a pending verification request,
    - **When** I view the page,
    - **Then** the upload form is hidden and status card displays *"A team member will review your document."*
- **Dependencies & Edge Cases**: Documents must be stored in secure private object storage (S3/R2); rejected submissions show reviewer reason.
- **Traceability**: `UC-009`, `FR-009`, `NFR-SEC-004`, `API-009`, `ENT-007`, `TC-STU-ADM-001`.
- **Evidence**: [src/pages/VerifyStudentPage.jsx#L1-L62](file:///e:/Coding_Projects/rommie-webapp/src/pages/VerifyStudentPage.jsx#L1-L62).

---

#### US-010: Reporting Inaccurate or Suspicious Listings
> **As a** room seeker who encountered misleading property information,  
> **I want** to submit a structured report flagging the issue,  
> **So that** Rommie administrators can investigate and remove fraudulent listings.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Reporting an unavailable room**:
    - **Given** I view a listing that the caretaker told me was already rented out,
    - **When** I click "Report", select "Already taken", and submit,
    - **Then** a report record is created with `status: "open"` and toast confirms *"Report sent"*.
  - **Scenario 2: Reporting with custom explanation**:
    - **Given** I select "Other" as the report reason,
    - **When** I submit,
    - **Then** an explanatory note textarea is mandatory to provide context to moderators.
- **Dependencies & Edge Cases**: Submitting report must not interrupt user browsing flow.
- **Traceability**: `UC-010`, `FR-010`, `NFR-USA-001`, `API-010`, `ENT-006`, `TC-ADM-REP-001`.
- **Evidence**: [src/components/ReportModal.jsx#L1-L49](file:///e:/Coding_Projects/rommie-webapp/src/components/ReportModal.jsx#L1-L49).

---

#### US-011: Campus Commute Proximity Zones
> **As a** student unfamiliar with local geography,  
> **I want** to view vacant listings grouped by distance to my campus,  
> **So that** I can ensure my daily walk or matatu commute is manageable.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Viewing rooms near specific campus**:
    - **Given** I navigate to `/zones`,
    - **When** I view the section for "CUEA",
    - **Then** I see the count of vacant rooms within ~20 minutes, the lowest starting rent, and top 4 listings sorted nearest-first.
  - **Scenario 2: Commute mode breakdown**:
    - **Given** a listing in Rongai,
    - **When** rendered in the campus section,
    - **Then** commute shows either walking minutes (if <= 20 min walk) or matatu minutes with estimated fare in KES.
- **Dependencies & Edge Cases**: Covers KSL, JKUAT Karen, Tangaza, CUEA, and Co-op.
- **Traceability**: `UC-011`, `FR-011`, `NFR-PERF-001`, `API-011`, `ENT-001`, `TC-HST-001`.
- **Evidence**: [src/pages/ZonesPage.jsx#L1-L55](file:///e:/Coding_Projects/rommie-webapp/src/pages/ZonesPage.jsx#L1-L55).

---

### 4.2 Caretaker User Stories

#### US-012: Caretaker Account Onboarding
> **As a** property caretaker or landlord,  
> **I want** to register an account tailored for property managers,  
> **So that** I can immediately publish rental vacancies to thousands of local students.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Caretaker onboarding**:
    - **Given** I am on `/caretaker/signup`,
    - **When** I complete the form without school prompts,
    - **Then** a caretaker account is provisioned, initial trust score is set to 50, and I am guided to phone verification.
- **Dependencies & Edge Cases**: Caretakers must verify their phone before posting to enable direct WhatsApp/call inquiries.
- **Traceability**: `UC-012`, `FR-012`, `NFR-SEC-003`, `API-012`, `ENT-002`, `ENT-003`, `TC-AUTH-001`.
- **Evidence**: [src/components/auth/SignupForm.jsx#L34-L123](file:///e:/Coding_Projects/rommie-webapp/src/components/auth/SignupForm.jsx#L34-L123).

---

#### US-013: Caretaker Authentication & Suspension Lockdown
> **As a** platform administrator and caretaker,  
> **I want** caretaker login to strictly verify credential validity and account suspension status,  
> **So that** suspended caretakers cannot access property management tools.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Active caretaker login**:
    - **Given** my caretaker account is in good standing,
    - **When** I log in at `/caretaker/login`,
    - **Then** I am routed directly to `/caretaker/listings`.
  - **Scenario 2: Suspended caretaker login attempt**:
    - **Given** an administrator has placed a suspension on my account,
    - **When** I attempt to log in,
    - **Then** authentication fails with message *"This account is suspended. Contact Rommie to get it restored."*
- **Dependencies & Edge Cases**: Suspension check must occur at the API boundary before issuing session tokens.
- **Traceability**: `UC-013`, `FR-013`, `NFR-SEC-003`, `API-013`, `ENT-002`, `TC-ADM-USR-001`.
- **Evidence**: [src/services/api.js#L737-L738](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L737-L738).

---

#### US-014: Publishing New Rental Listings
> **As a** caretaker,  
> **I want** to create a comprehensive property listing with pricing, commute times, amenities, and at least 3 photos,  
> **So that** students have accurate information and contact me only for genuine viewings.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Successful listing creation**:
    - **Given** I fill in all 20+ fields on `/caretaker/post` and upload 3 compressed photos,
    - **When** I click "Post room",
    - **Then** listing is created with `status: "Vacant"`, confirmed date set to today, and toast confirms *"Room posted. Students can see it now."*
  - **Scenario 2: Insufficient photos**:
    - **Given** I upload only 2 photos,
    - **When** I attempt to post,
    - **Then** form validation halts and highlights photo uploader: *"Add at least 3 photos so students can see the room."*
  - **Scenario 3: Hostel with multiple room types**:
    - **Given** I select "Hostel" as room type,
    - **When** I configure options (Single, 2 sharing),
    - **Then** system allows distinct pricing, billing (month vs semester), and separate photos per room option.
- **Dependencies & Edge Cases**: Client-side compression (UC-035) must scale images to <= 1600px before uploading.
- **Traceability**: `UC-014`, `FR-014`, `NFR-PERF-003`, `NFR-USA-001`, `API-014`, `API-035`, `ENT-001`.
- **Evidence**: [src/pages/CaretakerPostPage.jsx#L1-L56](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerPostPage.jsx#L1-L56), [src/components/caretaker/RoomForm.jsx#L1-L340](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/RoomForm.jsx#L1-L340).

---

#### US-015: Modifying Existing Property Listings
> **As a** caretaker,  
> **I want** to update listing descriptions, rent prices, and deposit terms,  
> **So that** my public listing reflects current market conditions and property upgrades.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Caretaker updating listing details**:
    - **Given** I own listing `r1`,
    - **When** I change rent on `/caretaker/edit/r1` and click "Save changes",
    - **Then** changes are persisted and toast displays *"Changes saved"*.
  - **Scenario 2: Unauthorized edit attempt**:
    - **Given** I attempt to edit a listing owned by another caretaker,
    - **When** the page loads,
    - **Then** system displays *"Room not found"* and blocks modification.
- **Dependencies & Edge Cases**: Backend must enforce strict ownership check: `room.caretakerId === session.userId`.
- **Traceability**: `UC-015`, `FR-015`, `NFR-SEC-004`, `API-015`, `ENT-001`, `TC-ROUT-001`.
- **Evidence**: [src/pages/CaretakerEditPage.jsx#L1-L56](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerEditPage.jsx#L1-L56).

---

#### US-016: Quick Vacancy Status Toggle with Undo
> **As a** busy caretaker,  
> **I want** to flip a single switch to mark a room Vacant or Taken,  
> **So that** students don't call me about taken rooms and I can immediately undo accidental taps.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Marking room as Taken**:
    - **Given** a vacant listing on `/caretaker/listings`,
    - **When** I toggle the switch to Taken,
    - **Then** status updates instantly, and toast shows *"Marked as taken"* with an "Undo" action.
  - **Scenario 2: Undoing accidental status change**:
    - **Given** I tapped the switch accidentally,
    - **When** I click "Undo" within the toast duration,
    - **Then** status reverts back to Vacant and its previous confirmed date is restored.
- **Dependencies & Edge Cases**: Marking Vacant automatically resets `lastConfirmedVacantAt` to current timestamp.
- **Traceability**: `UC-016`, `FR-016`, `NFR-PERF-001`, `API-016`, `ENT-001`, `TC-ROUT-001`.
- **Evidence**: [src/pages/CaretakerListingsPage.jsx#L31-L60](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerListingsPage.jsx#L31-L60).

---

#### US-017: Reconfirming Stale Listings
> **As a** caretaker with a vacant room listed for over 14 days,  
> **I want** to reconfirm that the room is still vacant with a single tap,  
> **So that** my listing remains prominent in search and recovers freshness trust points.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Reconfirming a 14-day stale listing**:
    - **Given** my listing has not been confirmed for 14+ days,
    - **When** I click *"Yes, still vacant"* on `/caretaker/listings`,
    - **Then** confirmation date updates to today, warning tag disappears, and toast confirms *"Thanks. Confirmed vacant today."*
  - **Scenario 2: Lifting an admin quarantine**:
    - **Given** an admin hid my room due to staleness,
    - **When** I tap *"Yes, still vacant"*,
    - **Then** system clears `hidden: false` and restores the listing to public search.
- **Dependencies & Edge Cases**: Freshness directly impacts caretaker trust score (30 max pts).
- **Traceability**: `UC-017`, `FR-017`, `NFR-PERF-001`, `API-017`, `ENT-001`, `TC-ROUT-001`.
- **Evidence**: [src/pages/CaretakerListingsPage.jsx#L61-L73](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerListingsPage.jsx#L61-L73), [src/services/api.js#L248-L251](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L248-L251).

---

#### US-018: Caretaker Listing Deletion
> **As a** caretaker,  
> **I want** to permanently delete a listing that no longer exists,  
> **So that** my dashboard remains uncluttered and students cannot discover obsolete properties.

- **Priority**: Low | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Confirming deletion**:
    - **Given** I click the Trash icon on my listing,
    - **When** the confirmation modal asks to delete and I confirm,
    - **Then** listing is removed from database and toast confirms *"Listing deleted"*.
  - **Scenario 2: Accidental click cancellation**:
    - **Given** the delete dialog is open,
    - **When** I click "Keep it",
    - **Then** listing is preserved without changes.
- **Dependencies & Edge Cases**: Permanent deletion cannot be undone; recommends marking "Taken" if temporarily rented.
- **Traceability**: `UC-018`, `FR-018`, `NFR-SEC-004`, `API-018`, `ENT-001`, `TC-ROUT-001`.
- **Evidence**: [src/pages/CaretakerListingsPage.jsx#L74-L114](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerListingsPage.jsx#L74-L114).

---

#### US-019: Cloning Building Details for Multi-Room Types
> **As a** caretaker managing a building with multiple room configurations,  
> **I want** to clone building location, distances, and contact details from an existing listing,  
> **So that** I can add bedsitters and single rooms without re-entering common property data.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Adding second room type to building**:
    - **Given** I have an existing bedsitter listing,
    - **When** I click "Add another room type",
    - **Then** `/caretaker/post?copy=:id` loads with area, deposit terms, campus commute times, and contact numbers pre-populated.
  - **Scenario 2: Linking sibling rooms**:
    - **When** I submit the new room listing,
    - **Then** both listings share the same `buildingId` and appear in each other's "Other rooms in this building" section.
- **Dependencies & Edge Cases**: Photos and specific room rent must NOT be copied.
- **Traceability**: `UC-019`, `FR-019`, `NFR-USA-001`, `API-019`, `ENT-001`, `ENT-011`, `TC-BLD-001`.
- **Evidence**: [src/pages/CaretakerPostPage.jsx#L28-L54](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerPostPage.jsx#L28-L54), [src/test/buildings.test.js#L1-L50](file:///e:/Coding_Projects/rommie-webapp/src/test/buildings.test.js#L1-L50).

---

#### US-020: Caretaker National Identity Document Submission
> **As a** caretaker aiming to maximize student inquiries,  
> **I want** to upload my National ID or Passport,  
> **So that** Rommie staff verify my identity and display a Verified Caretaker badge on all my listings.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Uploading ID document**:
    - **Given** I am on `/caretaker/profile` and unverified,
    - **When** I upload a clear photo or PDF of my national ID (<= 8 MB),
    - **Then** submission is queued for admin review and toast confirms *"Submitted. We'll review it soon."*
- **Dependencies & Edge Cases**: Verification awards 35 trust score points upon admin approval.
- **Traceability**: `UC-020`, `FR-020`, `NFR-SEC-004`, `API-020`, `ENT-007`, `ENT-003`.
- **Evidence**: [src/pages/CaretakerProfilePage.jsx#L62-L80](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerProfilePage.jsx#L62-L80).

---

#### US-021: Caretaker Trust Score Transparency
> **As a** caretaker,  
> **I want** to see an itemized breakdown of my 0-100 Trust Score across Verification, Freshness, Reports, and Account Age,  
> **So that** I understand how to boost my credibility and attract more student tenants.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Reviewing trust pillars**:
    - **Given** I am on `/caretaker/profile`,
    - **When** I inspect the Trust Score card,
    - **Then** I see points awarded out of 35 for Verification, 30 for Freshness, 25 for Reports, and 10 for Account Age.
- **Dependencies & Edge Cases**: Reports dock 8 points each; score cannot fall below 0 or exceed 100.
- **Traceability**: `UC-021`, `FR-021`, `NFR-USA-001`, `API-021`, `ENT-003`.
- **Evidence**: [src/lib/trust.js#L1-L49](file:///e:/Coding_Projects/rommie-webapp/src/lib/trust.js#L1-L49), [src/components/caretaker/TrustScoreCard.jsx](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/TrustScoreCard.jsx).

---

### 4.3 Administrator User Stories

#### US-022: Moderation Dashboard & Platform Health Surveillance
> **As a** Rommie platform administrator,  
> **I want** to monitor key platform counts (listings, vacancies, contacts, stale rooms, open reports, hidden rooms),  
> **So that** I can assess marketplace balance and rapidly triage operational issues.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Viewing dashboard metrics**:
    - **Given** I am signed in as `admin`,
    - **When** I navigate to `/admin`,
    - **Then** I see 6 metric cards populated with live system tallies.
  - **Scenario 2: Reviewing stale queue**:
    - **When** I scroll to "Stale listings",
    - **Then** I see all vacant rooms unconfirmed for 14+ days with caretaker names and quick "Hide" buttons.
- **Dependencies & Edge Cases**: Restricted strictly to `admin` role.
- **Traceability**: `UC-022`, `FR-022`, `NFR-PERF-001`, `API-022`, `ENT-001`, `TC-ROUT-001`.
- **Evidence**: [src/pages/AdminDashboardPage.jsx#L1-L138](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminDashboardPage.jsx#L1-L138).

---

#### US-023: Quarantining Stale Listings from Public Discovery
> **As an** administrator,  
> **I want** to hide stale vacant listings that haven't been reconfirmed by caretakers,  
> **So that** students do not waste time calling about rooms that may have already been rented.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Hiding a stale room**:
    - **Given** a listing unconfirmed for 14+ days,
    - **When** I click "Hide" and confirm,
    - **Then** `room.hidden = true`, it is removed from public search, and audit log `listing.hidden` is created.
- **Dependencies & Edge Cases**: The caretaker still sees the listing in their dashboard so they can reconfirm it.
- **Traceability**: `UC-023`, `FR-023`, `NFR-OBS-001`, `API-023`, `ENT-001`, `ENT-009`, `TC-ADM-LST-001`.
- **Evidence**: [src/pages/AdminDashboardPage.jsx#L28-L36](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminDashboardPage.jsx#L28-L36).

---

#### US-024: Restoring Quarantined Listings
> **As an** administrator,  
> **I want** to restore hidden listings back to the public website,  
> **So that** valid accommodations can resume receiving student inquiries.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Restoring a hidden listing**:
    - **Given** a hidden room on `/admin`,
    - **When** I click "Restore",
    - **Then** `room.hidden = false`, listing reappears in search, and audit log `listing.restored` is recorded.
- **Dependencies & Edge Cases**: If the listing is still stale, it displays a "Needs reconfirming" badge.
- **Traceability**: `UC-024`, `FR-024`, `NFR-OBS-001`, `API-024`, `ENT-001`, `ENT-009`, `TC-ADM-LST-001`.
- **Evidence**: [src/pages/AdminDashboardPage.jsx#L37-L44](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminDashboardPage.jsx#L37-L44).

---

#### US-025: Global Listing Management & Direct Intervention
> **As an** administrator,  
> **I want** to search all platform listings, edit inaccurate titles or rents, and delete spam,  
> **So that** the catalog maintains high standards of data integrity and trustworthiness.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Editing listing title and rent**:
    - **Given** I am on `/admin/listings`,
    - **When** I edit a listing's title to a descriptive string and adjust rent,
    - **Then** changes are saved and audit entry `listing.edited` records the specific attribute delta.
  - **Scenario 2: Deleting abusive listing**:
    - **Given** a scam listing,
    - **When** I delete it,
    - **Then** listing is permanently removed and any open reports about it are automatically marked resolved.
- **Dependencies & Edge Cases**: Hostel rent cannot be edited directly in admin dialog (derives from room options).
- **Traceability**: `UC-025`, `FR-025`, `NFR-SEC-004`, `API-025`, `ENT-001`, `ENT-006`, `TC-ADM-LST-001`.
- **Evidence**: [src/pages/AdminListingsPage.jsx#L1-L160](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminListingsPage.jsx#L1-L160).

---

#### US-026: Triage & Resolution of Abuse Reports
> **As an** administrator,  
> **I want** to review user reports and take corrective action (dismiss, resolve, or hide listing),  
> **So that** bad actors are penalized and reported inaccuracies are promptly addressed.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Hiding listing from a report**:
    - **Given** an open report on `/admin/reports`,
    - **When** I click "Hide listing",
    - **Then** the listing is hidden, all open reports on that room are resolved with action `"hidden"`, and audit entry is generated.
  - **Scenario 2: Dismissing unfounded report**:
    - **When** I click "Dismiss",
    - **Then** single report moves to "Handled" tab with status `"dismissed"`.
- **Dependencies & Edge Cases**: Handled reports display reviewer name and timestamp.
- **Traceability**: `UC-026`, `FR-026`, `NFR-SEC-004`, `API-026`, `ENT-006`, `ENT-001`, `TC-ADM-REP-001`.
- **Evidence**: [src/pages/AdminReportsPage.jsx#L1-L102](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminReportsPage.jsx#L1-L102).

---

#### US-027: User Management & Caretaker Suspension
> **As an** administrator,  
> **I want** to audit platform users and suspend rogue caretakers,  
> **So that** malicious accounts are prevented from logging in and their listings are wiped from search.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Suspending a caretaker**:
    - **Given** I am on `/admin/users`,
    - **When** I click "Suspend" on a caretaker and confirm,
    - **Then** caretaker ID is added to suspension set, all their listings disappear from public search, and caretaker login is blocked.
  - **Scenario 2: Restoring a caretaker**:
    - **When** I click "Restore" on a suspended caretaker,
    - **Then** suspension is lifted and their listings reappear.
- **Dependencies & Edge Cases**: Student accounts cannot be suspended in current UI.
- **Traceability**: `UC-027`, `FR-027`, `NFR-SEC-004`, `API-027`, `ENT-002`, `ENT-003`, `TC-ADM-USR-001`.
- **Evidence**: [src/pages/AdminUsersPage.jsx#L1-L120](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminUsersPage.jsx#L1-L120).

---

#### US-028: ID Verification Queue Moderation
> **As an** administrator,  
> **I want** to review uploaded Student and Caretaker ID documents,  
> **So that** only legitimate students and verified caretakers receive credibility badges.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Approving caretaker verification**:
    - **Given** a pending caretaker request on `/admin/verification`,
    - **When** I inspect the document preview and click "Approve",
    - **Then** request is approved, caretaker gains verified badge on all listings, and 35 trust points are awarded.
  - **Scenario 2: Rejecting verification with reason**:
    - **When** I click "Reject" and provide reason *"Document blurry"*,
    - **Then** request is marked rejected, reason saved, and applicant is prompted to re-upload.
- **Dependencies & Edge Cases**: Rejection requires mandatory non-empty reason string.
- **Traceability**: `UC-028`, `FR-028`, `NFR-SEC-004`, `API-028`, `ENT-007`, `ENT-003`, `TC-STU-ADM-001`.
- **Evidence**: [src/pages/AdminVerificationPage.jsx#L1-L145](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminVerificationPage.jsx#L1-L145).

---

#### US-029: Reversing Verification Decisions
> **As an** administrator,  
> **I want** to undo a previous verification decision in the history tab,  
> **So that** mistaken approvals or rejections can be re-evaluated without user friction.

- **Priority**: Low | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Undoing a review decision**:
    - **Given** an approved or rejected request in the History tab,
    - **When** I click "Undo",
    - **Then** request moves back to "pending" queue, reviewer details are wiped, any active badge is rescinded, and audit log `verification.undone` is created.
- **Dependencies & Edge Cases**: Does not permit undo on requests already pending.
- **Traceability**: `UC-029`, `FR-029`, `NFR-SEC-004`, `API-029`, `ENT-007`, `ENT-009`, `TC-STU-ADM-001`.
- **Evidence**: [src/pages/AdminVerificationPage.jsx#L38-L46](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminVerificationPage.jsx#L38-L46).

---

#### US-030: Administrative Audit Log Review
> **As a** platform auditor or lead administrator,  
> **I want** to inspect a persistent log of administrative actions,  
> **So that** I have full visibility into staff moderation activities.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Reviewing audit trail**:
    - **Given** I am on `/admin/activity`,
    - **When** the page renders,
    - **Then** I see the last 500 actions (hiding, edits, suspensions, approvals) with actor name and timestamps.
  - **Scenario 2: Filtering log by category**:
    - **When** I select "Verifications",
    - **Then** only `verification.*` actions are displayed.
- **Dependencies & Edge Cases**: Centralized log stored in FIFO capped queue (max 500 entries in mock).
- **Traceability**: `UC-030`, `FR-030`, `NFR-OBS-001`, `API-030`, `ENT-009`, `TC-ROUT-001`.
- **Evidence**: [src/pages/AdminActivityPage.jsx#L1-L49](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminActivityPage.jsx#L1-L49).

---

#### US-031: Platform Operational Analytics & Usage Trends
> **As an** administrator or product manager,  
> **I want** to analyze listing distributions, 14-day contact trends, and onboarding velocity,  
> **So that** I can make data-driven marketing and operational expansion decisions.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Evaluating market metrics**:
    - **Given** I visit `/admin/analytics`,
    - **When** charts load,
    - **Then** I see listings by area, vacancy percentages, 14-day WhatsApp/call totals, top 5 listings, and weekly caretaker signups.
- **Dependencies & Edge Cases**: Bar charts must explicitly print numbers alongside visual bars for accessibility compliance.
- **Traceability**: `UC-031`, `FR-031`, `NFR-USA-002`, `API-031`, `ENT-001`, `ENT-008`.
- **Evidence**: [src/pages/AdminAnalyticsPage.jsx#L1-L67](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminAnalyticsPage.jsx#L1-L67).

---

#### US-032: Platform Support Contact Settings Management
> **As an** administrator,  
> **I want** to update the site's WhatsApp, phone, email, hours, and location,  
> **So that** public footers and help pages immediately display accurate contact channels.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Updating support details**:
    - **Given** I am on `/admin/settings`,
    - **When** I update the support email and click "Save changes",
    - **Then** changes persist, audit entry `settings.updated` is logged, and the footer immediately renders new email.
- **Dependencies & Edge Cases**: Form includes "Reset to defaults" button.
- **Traceability**: `UC-032`, `FR-032`, `NFR-SEC-004`, `API-032`, `ENT-010`, `ENT-009`, `TC-ADM-SET-001`.
- **Evidence**: [src/pages/AdminSettingsPage.jsx#L1-L65](file:///e:/Coding_Projects/rommie-webapp/src/pages/AdminSettingsPage.jsx#L1-L65), [src/test/admin-settings.test.js#L1-L45](file:///e:/Coding_Projects/rommie-webapp/src/test/admin-settings.test.js#L1-L45).

---

### 4.4 System User Stories

#### US-033: Real-Time Cross-Tab Session Synchronization
> **As a** multi-tasking user with multiple Rommie tabs open,  
> **I want** logging in or out in one tab to instantly update all my open tabs,  
> **So that** I never experience session drift or perform unauthorized operations on stale screens.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Cross-tab logout**:
    - **Given** I have Rommie open in Tab 1 and Tab 2,
    - **When** I click Log Out in Tab 1,
    - **Then** Tab 2 detects the storage event and immediately transitions to unauthenticated guest state without page reload.
- **Dependencies & Edge Cases**: Driven by HTML5 `storage` event listener on `rommie.session`.
- **Traceability**: `UC-033`, `FR-033`, `NFR-SEC-003`, `API-033`, `ENT-002`, `TC-AUTH-001`.
- **Evidence**: [src/services/api.js#L681-L694](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js#L681-L694), [src/lib/auth.jsx#L8-L12](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx#L8-L12).

---

#### US-034: Network Offline Status Detection & Non-Intrusive Warning
> **As a** mobile user on intermittent cellular connections,  
> **I want** to see an immediate visual banner when my connection drops,  
> **So that** I know why fresh searches or uploads may be unavailable.

- **Priority**: Medium | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Losing network connection**:
    - **Given** I am browsing Rommie,
    - **When** browser emits an `offline` event,
    - **Then** a fixed notification banner appears below the header: *"You're offline. Some things may not load until you're back online."*
  - **Scenario 2: Regaining connection**:
    - **When** network connectivity is restored,
    - **Then** the offline banner automatically unmounts.
- **Dependencies & Edge Cases**: Uses `useSyncExternalStore` over `window.online` and `window.offline`.
- **Traceability**: `UC-034`, `FR-034`, `NFR-AVAIL-003`, `API-034`.
- **Evidence**: [src/components/OfflineBanner.jsx#L1-L20](file:///e:/Coding_Projects/rommie-webapp/src/components/OfflineBanner.jsx#L1-L20).

---

#### US-035: Client-Side Photographic Compression
> **As a** caretaker uploading multiple room photos on a mobile data bundle,  
> **I want** photos to be compressed and downscaled directly in my browser before uploading,  
> **So that** uploads complete quickly, don't fail over slow 3G connections, and consume minimal cellular bandwidth.

- **Priority**: High | **Status**: Confirmed
- **Acceptance Criteria**:
  - **Scenario 1: Uploading large high-res camera photo**:
    - **Given** I select a 10 MB JPEG (4000x3000 px),
    - **When** `PhotoUploader` processes the file,
    - **Then** `compressImage` scales image down to maximum 1600px dimension at 0.82 JPEG quality, reducing payload size by ~80% before transmission.
  - **Scenario 2: Already optimized images**:
    - **Given** an image whose compressed blob is larger than original,
    - **When** compression evaluates,
    - **Then** original file is retained.
- **Dependencies & Edge Cases**: Falls back gracefully to original file if canvas fails.
- **Traceability**: `UC-035`, `FR-035`, `NFR-PERF-003`, `API-035`, `TC-BLD-001`.
- **Evidence**: [src/lib/image.js#L1-L22](file:///e:/Coding_Projects/rommie-webapp/src/lib/image.js#L1-L22), [src/components/caretaker/PhotoUploader.jsx#L16](file:///e:/Coding_Projects/rommie-webapp/src/components/caretaker/PhotoUploader.jsx#L16).

---

## 5. Traceability Matrix Summary

The following matrix establishes bidirectional traceability linking every Use Case, User Story, Functional Requirement (`FR-*`), Non-Functional Requirement (`NFR-*`), API Operation (`API-*`), Data Entity (`ENT-*`), and Automated Test Suite (`TC-*`):

```
+--------------------------------------------------------------------------------------------------------------------+
|                                         END-TO-END TRACEABILITY MATRIX                                             |
+--------+--------+--------+------------------+------------------------------+--------------------+------------------+
| UC ID  | US ID  | FR ID  | NFR ID           | API Operations               | Entities Mapped    | Test Suite ID    |
+--------+--------+--------+------------------+------------------------------+--------------------+------------------+
| UC-001 | US-001 | FR-001 | NFR-PERF-001/002 | API-001 (getRooms)           | ENT-001, ENT-003   | TC-ROUT-001      |
| UC-002 | US-002 | FR-002 | NFR-PERF-003     | API-002 (getRoom/Building)   | ENT-001/003/011    | TC-HST-001       |
| UC-003 | US-003 | FR-003 | NFR-INT-003      | API-003 (trackContact)       | ENT-008            | TC-CON-001..004  |
| UC-004 | US-004 | FR-004 | NFR-USA-001      | API-004 (save/unsaveRoom)    | ENT-004, ENT-001   | TC-ROUT-001      |
| UC-005 | US-005 | FR-005 | NFR-PERF-001     | API-005 (create/deleteAlert) | ENT-005            | TC-ROUT-001      |
| UC-006 | US-006 | FR-006 | NFR-SEC-003      | API-006 (signUp)             | ENT-002            | TC-AUTH-001      |
| UC-007 | US-007 | FR-007 | NFR-SEC-003      | API-007 (login/logout)       | ENT-002            | TC-AUTH-001      |
| UC-008 | US-008 | FR-008 | NFR-SEC-002      | API-008 (send/verifyOtp)     | ENT-002            | TC-AUTH-001      |
| UC-009 | US-009 | FR-009 | NFR-SEC-004      | API-009 (submitVerification) | ENT-007            | TC-STU-ADM-001   |
| UC-010 | US-010 | FR-010 | NFR-USA-001      | API-010 (submitReport)       | ENT-006, ENT-001   | TC-ADM-REP-001   |
| UC-011 | US-011 | FR-011 | NFR-PERF-001     | API-011 (minutesTo/getRooms) | ENT-001            | TC-HST-001       |
| UC-012 | US-012 | FR-012 | NFR-SEC-003      | API-012 (signUp caretaker)   | ENT-002, ENT-003   | TC-AUTH-001      |
| UC-013 | US-013 | FR-013 | NFR-SEC-003      | API-013 (login suspended)    | ENT-002            | TC-ADM-USR-001   |
| UC-014 | US-014 | FR-014 | NFR-PERF-003     | API-014 (createListing)      | ENT-001            | TC-BLD-001       |
| UC-015 | US-015 | FR-015 | NFR-SEC-004      | API-015 (updateListing)      | ENT-001            | TC-ROUT-001      |
| UC-016 | US-016 | FR-016 | NFR-PERF-001     | API-016 (setRoomStatus)      | ENT-001            | TC-ROUT-001      |
| UC-017 | US-017 | FR-017 | NFR-PERF-001     | API-017 (reconfirmRoom)      | ENT-001            | TC-ROUT-001      |
| UC-018 | US-018 | FR-018 | NFR-SEC-004      | API-018 (deleteListing)      | ENT-001            | TC-ROUT-001      |
| UC-019 | US-019 | FR-019 | NFR-USA-001      | API-019 (create with bldId)  | ENT-001, ENT-011   | TC-BLD-001       |
| UC-020 | US-020 | FR-020 | NFR-SEC-004      | API-020 (submitVerification) | ENT-007, ENT-003   | TC-STU-ADM-001   |
| UC-021 | US-021 | FR-021 | NFR-USA-001      | API-021 (computeTrust)       | ENT-003            | TC-AUTH-001      |
| UC-022 | US-022 | FR-022 | NFR-PERF-001     | API-022 (getAdminStats)      | ENT-001/006/008    | TC-ROUT-001      |
| UC-023 | US-023 | FR-023 | NFR-OBS-001      | API-023 (hideListing)        | ENT-001, ENT-009   | TC-ADM-LST-001   |
| UC-024 | US-024 | FR-024 | NFR-OBS-001      | API-024 (restoreListing)     | ENT-001, ENT-009   | TC-ADM-LST-001   |
| UC-025 | US-025 | FR-025 | NFR-SEC-004      | API-025 (adminUpdate/Delete) | ENT-001, ENT-009   | TC-ADM-LST-001   |
| UC-026 | US-026 | FR-026 | NFR-SEC-004      | API-026 (reviewReport)       | ENT-006, ENT-009   | TC-ADM-REP-001   |
| UC-027 | US-027 | FR-027 | NFR-SEC-004      | API-027 (setCaretakerSusp)   | ENT-002, ENT-009   | TC-ADM-USR-001   |
| UC-028 | US-028 | FR-028 | NFR-SEC-004      | API-028 (reviewVerification) | ENT-007, ENT-009   | TC-STU-ADM-001   |
| UC-029 | US-029 | FR-029 | NFR-SEC-004      | API-029 (undoVerification)   | ENT-007, ENT-009   | TC-STU-ADM-001   |
| UC-030 | US-030 | FR-030 | NFR-OBS-001      | API-030 (getActivity)        | ENT-009            | TC-ROUT-001      |
| UC-031 | US-031 | FR-031 | NFR-USA-002      | API-031 (getAdminAnalytics)  | ENT-001/003/008    | TC-ROUT-001      |
| UC-032 | US-032 | FR-032 | NFR-SEC-004      | API-032 (updateSiteSettings) | ENT-010, ENT-009   | TC-ADM-SET-001   |
| UC-033 | US-033 | FR-033 | NFR-SEC-003      | API-033 (subscribeSession)   | ENT-002            | TC-AUTH-001      |
| UC-034 | US-034 | FR-034 | NFR-AVAIL-003    | API-034 (OfflineBanner)      | None (DOM)         | TC-ROUT-001      |
| UC-035 | US-035 | FR-035 | NFR-PERF-003     | API-035 (compressImage)      | None (Blob/File)   | TC-BLD-001       |
+--------+--------+--------+------------------+------------------------------+--------------------+------------------+
```

---

## 6. Assumptions and Open Decisions

### 6.1 Architectural Assumptions
- **ASM-001 (PostgreSQL & PostGIS Readiness)**: While the frontend currently computes commute times via fixed distance attributes and pre-calculated walk/matatu minutes ([src/types/index.js#L16-L19](file:///e:/Coding_Projects/rommie-webapp/src/types/index.js#L16-L19)), the backend implementation will store coordinates as `geography(Point, 4326)` to enable efficient bounding box spatial search.
- **ASM-002 (Presigned Upload URLs)**: Production backend will generate presigned PUT URLs for direct client-to-S3/R2 uploads rather than streaming multi-megabyte image buffers through backend application servers.
- **ASM-003 (Transactional Email Service Integration)**: OTP verification codes and vacancy alert emails will be handled by a high-reputation transactional email service provider (e.g., Brevo, Postmark, or AWS SES) configured with SPF, DKIM, and DMARC DNS records. Email OTP eliminates telco per-SMS charges while preserving user onboarding convenience.

### 6.2 Open Decisions Requiring Owner Approval
- **OQ-001 (Automated 14-Day Stale Cron vs Manual Admin Quarantine)**: Currently, stale listings are flagged in the admin dashboard and caretakers are notified, but an admin manually clicks "Hide". Should the production backend execute an automated nightly cron job that quarantines listings unconfirmed after 14 days without human intervention?
  - *Recommendation*: Implement an automated cron job that sets `hidden = true` at day 15, sending an automated email warning to the caretaker at day 12.
- **OQ-002 (Caretaker Identity Verification Document Retention)**: Kenyan Data Protection Act (2019) mandates strict purpose limitation. Once an admin reviews and approves or rejects a Caretaker National ID or passport document (Student ID verification retired per Alvan's review), should the raw document image file be permanently purged after 30 days, retaining only the verification audit badge and decision metadata?
  - *Recommendation*: Automatically delete raw document files 30 days post-review, keeping only verification status, reviewed timestamp, and admin actor ID in the database.

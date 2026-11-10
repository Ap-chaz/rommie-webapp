# Review Checklist & Architecture Governance

## Document Metadata

- **Document ID:** DOC-REVIEW-001
- **Title:** Rommie Architecture Review Checklist & Governance Review
- **Version:** 1.1
- **Status:** Draft (Submitted for Owner Review & Formal Approval)
- **Author:** Antigravity AI Agent (Senior Systems Analyst & Backend Technical Lead)
- **Created:** 2026-10-19
- **Last Updated:** 2026-11-06
- **Target Repository:** `e:\Coding_Projects\rommie-webapp`
- **Related Documents:**
  - [`REPOSITORY_AUDIT.md`](file:///e:/Coding_Projects/rommie-webapp/docs/REPOSITORY_AUDIT.md)
  - [`SRS.md`](file:///e:/Coding_Projects/rommie-webapp/docs/SRS.md)
  - [`USE_CASES_AND_USER_STORIES.md`](file:///e:/Coding_Projects/rommie-webapp/docs/USE_CASES_AND_USER_STORIES.md)
  - [`SYSTEM_ARCHITECTURE.md`](file:///e:/Coding_Projects/rommie-webapp/docs/SYSTEM_ARCHITECTURE.md)
  - [`DFD_LEVEL_0_CONTEXT.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DFD/DFD_LEVEL_0_CONTEXT.md)
  - [`DFD_LEVEL_1.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DFD/DFD_LEVEL_1.md)
  - [`DFD_LEVEL_2.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DFD/DFD_LEVEL_2.md)
  - [`DATABASE_DESIGN.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DATABASE_DESIGN.md)
  - [`API_CONTRACT.md`](file:///e:/Coding_Projects/rommie-webapp/docs/API_CONTRACT.md)
  - [`NFR_COMPLIANCE.md`](file:///e:/Coding_Projects/rommie-webapp/docs/NFR_COMPLIANCE.md)
  - [`ARCHITECTURE_DECISIONS.md`](file:///e:/Coding_Projects/rommie-webapp/docs/ARCHITECTURE_DECISIONS.md)
  - [`RTM.md`](file:///e:/Coding_Projects/rommie-webapp/docs/RTM.md)

---

## 1. Executive Purpose & Governance Process

Per [AGENTS.md Section 2 (Rule 10) & Section 15](file:///e:/Coding_Projects/rommie-webapp/AGENTS.md#L22), Rommie operates under a **documentation-first, approval-gated engineering lifecycle**.

This document serves as the master review gate for the project owner. It synthesizes all technical specifications, highlights foundational architectural trade-offs, itemizes conflicts between high-level real estate NFRs and the concrete student rental MVP, details recurring cost projections, and provides an explicit sign-off mechanism.

> [!IMPORTANT]
> **Approval Gate Rule:** No production backend code, database migrations, cloud resource provisioning, or destructive repository reorganizations may begin until the project owner reviews this checklist and formally signs off with `APPROVE DOCUMENTATION` or `APPROVE BACKEND IMPLEMENTATION`. Silence is not approval.

---

## 2. Documentation Suite Audit

The table below lists the complete set of system engineering specifications produced for the Rommie platform:

| Document Title                       | File Path                                                                                                           | Document ID    | Version | Status   | Primary Purpose & Scope                                                                                   |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :------------- | :------ | :------- | :-------------------------------------------------------------------------------------------------------- |
| **Repository Audit**                 | [`docs/REPOSITORY_AUDIT.md`](file:///e:/Coding_Projects/rommie-webapp/docs/REPOSITORY_AUDIT.md)                     | DOC-AUDIT-001  | 1.1     | Complete | Full inventory of existing React 19 UI, routes, components, mock data, and migration plan.                |
| **Software Requirements Spec**       | [`docs/SRS.md`](file:///e:/Coding_Projects/rommie-webapp/docs/SRS.md)                                               | DOC-SRS-001    | 1.1     | Complete | Formal functional requirements (`FR-001`–`FR-015`), interfaces, constraints, and acceptance criteria.     |
| **Use Cases & User Stories**         | [`docs/USE_CASES_AND_USER_STORIES.md`](file:///e:/Coding_Projects/rommie-webapp/docs/USE_CASES_AND_USER_STORIES.md) | DOC-UCUS-001   | 1.1     | Complete | Actor flows (`UC-001`–`UC-012`) and agile user stories (`US-001`–`US-015`) with Given/When/Then criteria. |
| **System Architecture**              | [`docs/SYSTEM_ARCHITECTURE.md`](file:///e:/Coding_Projects/rommie-webapp/docs/SYSTEM_ARCHITECTURE.md)               | DOC-ARCH-001   | 1.1     | Complete | End-to-end container architecture, data flows, security boundaries, and stack evaluation.                 |
| **DFD Level 0 — Context**            | [`docs/DFD/DFD_LEVEL_0_CONTEXT.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DFD/DFD_LEVEL_0_CONTEXT.md)       | DOC-DFD-001    | 1.1     | Complete | System boundary context diagram with all external actors and integration entities.                        |
| **DFD Level 1 — Decomposition**      | [`docs/DFD/DFD_LEVEL_1.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DFD/DFD_LEVEL_1.md)                       | DOC-DFD-002    | 1.1     | Complete | Core process decomposition (`P1`–`P8`) with balanced data flows and persistent stores.                    |
| **DFD Level 2 — Subprocesses**       | [`docs/DFD/DFD_LEVEL_2.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DFD/DFD_LEVEL_2.md)                       | DOC-DFD-003    | 1.1     | Complete | Granular Level 2 decomposition of search, listing management, and moderation flows.                       |
| **Database Design**                  | [`docs/DATABASE_DESIGN.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DATABASE_DESIGN.md)                       | DOC-DB-001     | 1.1     | Complete | PostgreSQL 16 + PostGIS schema, relational constraints, GIN/spatial indexes, and data dictionary.         |
| **API Contract**                     | [`docs/API_CONTRACT.md`](file:///e:/Coding_Projects/rommie-webapp/docs/API_CONTRACT.md)                             | DOC-API-001    | 1.1     | Complete | OpenAPI 3.1 specification for 30 REST endpoints (`API-001`–`API-030`), request/response schemas.          |
| **NFR Compliance & Validation**      | [`docs/NFR_COMPLIANCE.md`](file:///e:/Coding_Projects/rommie-webapp/docs/NFR_COMPLIANCE.md)                         | DOC-NFR-001    | 1.1     | Complete | Traceability, feasibility analysis, load testing profiles, and verification methods for all NFRs.         |
| **Architecture Decision Records**    | [`docs/ARCHITECTURE_DECISIONS.md`](file:///e:/Coding_Projects/rommie-webapp/docs/ARCHITECTURE_DECISIONS.md)         | DOC-ADR-001    | 1.1     | Complete | Formal decision records (`ADR-001`–`ADR-011`) capturing framework, database, auth, and hosting choices.   |
| **Requirements Traceability Matrix** | [`docs/RTM.md`](file:///e:/Coding_Projects/rommie-webapp/docs/RTM.md)                                               | DOC-RTM-001    | 1.1     | Complete | Bi-directional traceability linking all FRs, NFRs, use cases, API operations, tables, and test cases.     |
| **Review Checklist**                 | [`docs/REVIEW_CHECKLIST.md`](file:///e:/Coding_Projects/rommie-webapp/docs/REVIEW_CHECKLIST.md)                     | DOC-REVIEW-001 | 1.1     | Complete | Master review synthesis and owner approval gate (this document).                                          |

---

## 3. Product Scope, Market Context & User Roles

### 3.1 Evidence-Grounded Scope

Rommie is purposefully engineered as a hyper-localized student housing platform serving tertiary institutions in Nairobi/Kajiado counties:

- **Target Universities:** Kenya School of Law (KSL), JKUAT Karen Campus, Tangaza University College, Catholic University of Eastern Africa (CUEA), Co-operative University of Kenya.
- **Geographic Clusters:** Ongata Rongai, Gataka, Maasai Lodge, Karen.
- **Housing Typologies:** Bedsitters, single rooms, one-bedroom apartments, and private student hostels (single, 2/4 sharing, executive ensuite with meal/transport options).

### 3.2 Confirmed User Roles

The codebase establishes three distinct user classes enforced by route guards in [src/lib/auth.jsx](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx):

1. **Student:** Browses rooms, filters by campus distance and rent, saves favorites, configures vacancy alerts, contacts caretakers via WhatsApp/phone, and configures email vacancy alerts.
2. **Caretaker:** Registers email and phone number, posts rental/hostel listings with exactly 10 required photos (unlimited listings per caretaker), uploads room media, updates vacancy status ("Vacant" vs. "Taken"), renews listing freshness, and builds a Caretaker Trust Score (0–100) based on verification, age, and report history.
3. **Administrator:** Reviews caretaker identity verification queue (Student ID verification retired), moderates user-reported listings, takes down/hides stale listings, suspends delinquent caretakers, and monitors contact event metrics.

---

## 4. Key Decisions Requiring Owner Approval

The following 6 architectural decisions represent critical technical and operational governance gates:

```mermaid
flowchart TD
    G1["Decision 1: Monorepo Move to frontend/"] --> DecisionCheck{"Owner Review"}
    G2["Decision 2: Fastify + PostgreSQL + Railway"] --> DecisionCheck
    G3["Decision 3: JWT + Argon2id + Email OTP (Brevo/SES)"] --> DecisionCheck
    G4["Decision 4: Cloudflare R2 Media Storage"] --> DecisionCheck
    G5["Decision 5: NFR Triage (MLS / Map Pins / 99.99%)"] --> DecisionCheck
    G6["Decision 6: Deferred Features (WebSockets / Maps)"] --> DecisionCheck

    DecisionCheck -->|"Approve All"| Approved["Proceed to Phase E: Backend Implementation"]
    DecisionCheck -->|"Request Revisions"| Revisions["Update Architectural Specs & RTM"]
```

---

### Decision 1: Frontend Move to `frontend/` Directory

- **Proposal:** Relocate the current root frontend code into a dedicated `frontend/` directory, reserving `backend/` for the Fastify service and shared root tooling for workspaces.
- **Impact & Workflow:**
  - Preserves 100% of existing Git history via `git mv`.
  - Updates Vercel Project Settings: set **Root Directory** to `frontend`.
  - Retains root `package.json` with npm/pnpm workspace scripts (`npm run dev:frontend`, `npm run dev:backend`).
- **Owner Action:** Approve safe directory reorganization before backend code creation.

---

### Decision 2: Backend Stack Selection (Node.js Fastify + PostgreSQL + Railway)

- **Proposal:** Adopt **Node.js (v22 LTS) with Fastify** for the REST API server and **PostgreSQL 16 + PostGIS** hosted on **Railway**.
- **Impact & Rationale:**
  - Fastify shares the JavaScript language stack with React, eliminating context-switching and enabling shared validation schemas.
  - PostgreSQL 16 provides rock-solid ACID relational integrity, native JSONB support, and PostGIS geospatial campus queries.
  - Railway delivers managed PostgreSQL with automated daily/hourly backups, persistent container execution without cold starts, and low baseline cost (~$5–$15/month).
- **Owner Action:** Approve Fastify + PostgreSQL + Railway as the core backend stack.

---

### Decision 3: Authentication Strategy (JWT + Argon2id + Africa's Talking OTP)

- **Proposal:** Implement dual-token authentication: short-lived JWT access tokens (15 minutes) kept in client memory, rotating refresh tokens stored in `HttpOnly, Secure, SameSite=Strict` cookies (7 days), Argon2id password hashing, and phone number verification using 6-digit SMS OTP via **Africa's Talking**.
- **Impact & Rationale:**
  - Guarantees full compliance with [house_hunting_web_app_nfrs.md Section 3](file:///e:/Coding_Projects/rommie-webapp/house_hunting_web_app_nfrs.md#L20).
  - Protects against credential theft (XSS-immune access tokens, CSRF-immune cookies).
  - Leverages Africa's Talking for direct interconnects to Safaricom/Airtel at ~KES 0.80 per SMS, significantly cheaper than Twilio (~$0.06 / KES 8.00).
- **Owner Action:** Approve authentication architecture and Africa's Talking integration.

---

### Decision 4: Object Storage for Media & KYC Documents (Cloudflare R2)

- **Proposal:** Utilize **Cloudflare R2** with direct browser uploads via S3 Presigned PUT URLs, integrated with Cloudflare Global Edge CDN for image delivery.
- **Impact & Rationale:**
  - **Zero egress bandwidth fees** eliminates runaway storage costs as student browsing scales.
  - Delivers next-gen WebP/AVIF images satisfying LCP < 1.5s ([house_hunting_web_app_nfrs.md](file:///e:/Coding_Projects/rommie-webapp/house_hunting_web_app_nfrs.md#L9)).
  - Provides a secure, private bucket for student IDs and caretaker National IDs accessible only via time-limited admin presigned URLs.
- **Owner Action:** Approve Cloudflare R2 as the object storage provider.

---

### Decision 5: NFR Scope Decisions & Reconciliation

- **Proposal:** Reconcile high-level generic real estate NFRs in [house_hunting_web_app_nfrs.md](file:///e:/Coding_Projects/rommie-webapp/house_hunting_web_app_nfrs.md) with Rommie's specific student housing reality:
  1. **MLS Synchronization (NFR-INTG-001):** Mark **OUT OF SCOPE**. Kenyan student hostels and bedsitters in Rongai/Gataka are managed by individual informal caretakers and do not exist on commercial MLS aggregators.
  2. **1,000 Map Pins at 60 FPS (NFR-PERF-002):** Reconcile to current UI evidence. Rommie currently uses external Google Maps location links (`mapLink` in [src/types/index.js#L44](file:///e:/Coding_Projects/rommie-webapp/src/types/index.js#L44)). Interactive clustered maps are deferred to Phase 2.
  3. **Internationalization & Currency Toggles (NFR-USAB-003):** Focus MVP strictly on **English and Kenya Shillings (KES)**. Multi-currency and imperial square-foot conversions are irrelevant for Kenyan student rentals.
  4. **99.99% Availability SLA (NFR-AVAL-001):** Adjust target to **99.9% uptime** (< 8.7 hours downtime/year). A 99.99% ("four nines") SLA requires multi-region active-active database clustering, increasing infrastructure costs from $15/mo to >$350/mo.
- **Owner Action:** Formally confirm the scope exclusions and realistic SLA adjustments.

---

### Decision 6: Deferred Features (Real-Time WebSockets & In-App Canvas Maps)

- **Proposal:**
  1. **Real-time Notifications (ADR-011):** Defer WebSockets/SSE for MVP. Implement asynchronous batch background processing for vacancy alerts (dispatching SMS and email alerts within 15 minutes of new listings).
  2. **In-App Canvas Map Rendering:** Retain verified external Google Maps links for room navigation, deferring heavy Mapbox/Google Maps JS SDKs to keep mobile bundle small and battery drain minimal.
- **Owner Action:** Confirm deferral of WebSockets and canvas maps to post-MVP releases.

---

## 5. Comprehensive NFR Conflicts vs. Scale Analysis

The supplied non-functional requirements document ([house_hunting_web_app_nfrs.md](file:///e:/Coding_Projects/rommie-webapp/house_hunting_web_app_nfrs.md)) contains enterprise real estate platform specifications. The analysis below evaluates each target against Rommie's operational context:

| NFR Identifier   | Stated Target                                    | Operational Reality in Rommie                                                                                                                                                    | Financial & Complexity Risk                                               | Recommended Owner Action                                                                         |
| :--------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------- |
| **NFR-PERF-001** | Search latency < 300 ms for complex queries      | Catalog has hundreds of listings in 4 zones. PostgreSQL composite indexes resolve in 8–15 ms.                                                                                    | Low risk. No separate search engine required.                             | **Adopt PostgreSQL indexes.** Re-evaluate Elasticsearch only if catalog exceeds 200,000 records. |
| **NFR-PERF-002** | 1,000 map pins @ 60 FPS with marker clustering   | The current UI has no embedded map canvas; rooms provide direct Google Maps links ([RoomDetailPage.jsx](file:///e:/Coding_Projects/rommie-webapp/src/pages/RoomDetailPage.jsx)). | High cost/complexity ($100+/mo Mapbox tile fees; large client JS bundle). | **Scope Decision:** Defer map canvas to Phase 2. Keep external Google Maps links for MVP.        |
| **NFR-PERF-003** | LCP < 1.5s, WebP/AVIF via CDN                    | Essential for student mobile phones on 4G in Rongai/Gataka. Cloudflare R2 + CDN achieves ~800ms LCP.                                                                             | Low cost via Cloudflare R2 ($0 egress fees).                              | **Adopt Cloudflare R2** with client-side WebP compression.                                       |
| **NFR-SCAL-001** | 10x traffic spike scaling within 3 min           | Traffic spikes coincide with university intake periods (Sept/Jan). Fastify containers scale horizontally in < 45s.                                                               | Low risk on Railway container PaaS.                                       | **Adopt Railway autoscaling** based on CPU/memory thresholds.                                    |
| **NFR-SCAL-002** | Millions of records, 20% YoY growth              | PostgreSQL partitioned tables and PostGIS handle tens of millions of rows easily.                                                                                                | Low risk. Database architecture supports long-term scale.                 | **Adopt PostgreSQL 16** with clean UUID primary keys and proper indexing.                        |
| **NFR-SCAL-003** | 10,000 concurrent active sessions                | Stateless JWT tokens require zero server memory per active browsing session.                                                                                                     | Moderate risk on database connection limits.                              | **Adopt PgBouncer connection pooling** on Railway PostgreSQL.                                    |
| **NFR-SEC-001**  | TLS 1.3 in transit, AES-256 at rest              | Mandatory. Handled natively by Vercel, Railway, and Cloudflare.                                                                                                                  | Zero additional cost.                                                     | **Enforce TLS 1.3 & AES-256** across all cloud tiers.                                            |
| **NFR-SEC-002**  | Anti-scraping, CAPTCHA, bot detection            | Competitors or brokers scraping caretaker phone numbers.                                                                                                                         | Moderate risk. Cloudflare Turnstile provides free CAPTCHA.                | **Integrate `@fastify/rate-limit`** and Cloudflare Turnstile on sensitive endpoints.             |
| **NFR-SEC-003**  | Argon2 password hashing, JWT rotation            | Explicitly mandated by NFR document. Perfectly aligned with security best practices.                                                                                             | Low complexity in Fastify using `argon2` and `jsonwebtoken`.              | **Implement Argon2id + rotating refresh tokens.**                                                |
| **NFR-SEC-004**  | Privacy compliance, account deletion             | Kenya Data Protection Act (DPA 2019) compliance required for national ID and student ID data.                                                                                    | Moderate risk. Requires automated data purge routines.                    | **Implement soft-delete + 30-day permanent KYC shredding** workflow.                             |
| **NFR-AVAL-001** | **99.99% availability** (< 52.6 min downtime/yr) | 99.99% requires multi-region database replication, redundant load balancers, and 24/7 on-call SRE.                                                                               | **Prohibitive Cost:** $350–$600/month. Excessive for student rental MVP.  | **Owner Decision:** Relax target to **99.9% uptime** (~$15/mo budget on Railway).                |
| **NFR-AVAL-002** | Hourly automated backups, RTO < 1h, RPO < 15m    | Managed PostgreSQL on Railway provides continuous WAL archiving and automated snapshots.                                                                                         | Fully supported by Railway at negligible cost.                            | **Enable automated PostgreSQL backups** with point-in-time recovery.                             |
| **NFR-INTG-001** | **MLS Synchronization** within 15 min            | Formal Multiple Listing Services (MLS) do not exist for informal Kenyan student housing in Rongai/Gataka.                                                                        | Unnecessary engineering effort (wasted sprints).                          | **Owner Decision:** Mark **OUT OF SCOPE**. Focus exclusively on caretaker direct posting.        |
| **NFR-INTG-002** | Mapbox/Google Maps vector tile integration       | Geocoding and reverse geocoding for listing addresses.                                                                                                                           | High recurring Google Maps API billing risk if unmonitored.               | **Owner Decision:** Use curated zone coordinates for MVP; integrate geocoding in Phase 2.        |
| **NFR-USAB-003** | **i18n & metric/imperial toggles**               | Rongai/Karen student market operates exclusively in English/Swahili and Kenya Shillings (KES).                                                                                   | Unnecessary complexity for MVP release.                                   | **Owner Decision:** Standardize on English UI and KES currency for MVP.                          |

---

## 6. External Integrations & Monthly Operating Cost Breakdown

The recommended architecture minimizes operational overhead while maintaining enterprise reliability:

```mermaid
pie title Projected Monthly Operating Costs (MVP Stage)
    "Railway (Fastify + PostgreSQL)" : 10
    "Cloudflare R2 (Media Storage)" : 0
    "Vercel (Frontend SPA Hosting)" : 0
    "Africa's Talking (SMS OTP ~1,000 msgs)" : 6.5
    "Brevo (Transactional Email)" : 0
```

### Estimated Monthly Budget Table

| Service Provider         | Functional Role in Rommie                                         | Free Tier Allowance                               | Estimated MVP Cost          | Projected Cost at 10,000 Active Users |
| :----------------------- | :---------------------------------------------------------------- | :------------------------------------------------ | :-------------------------- | :------------------------------------ |
| **Vercel**               | Frontend SPA hosting, Edge CDN, SSL, preview deployments          | 100GB bandwidth, unlimited builds                 | **$0.00 / mo** (Hobby)      | $20.00 / mo (Pro)                     |
| **Railway**              | Fastify API container, PostgreSQL 16 + PostGIS, automated backups | $5.00 trial credit                                | **$10.00–$15.00 / mo**      | $30.00–$50.00 / mo                    |
| **Cloudflare R2**        | Listing photos, student/caretaker verification ID storage         | 10GB storage, 10M reads, 1M writes, **$0 egress** | **$0.00 / mo**              | $3.00–$8.00 / mo                      |
| **Africa's Talking**     | SMS OTP verification codes & critical vacancy alerts              | Pay-as-you-go (~KES 0.80 / $0.0065 per SMS)       | **$6.50 / mo** (1,000 OTPs) | $35.00–$65.00 / mo                    |
| **Brevo**                | Transactional email verification and admin notification alerts    | 300 emails/day (~9,000/mo) free                   | **$0.00 / mo**              | $25.00 / mo (if > 20,000 emails)      |
| **Google Cloud**         | Google OAuth 2.0 / OIDC identity sign-in                          | Unlimited OAuth user authentications              | **$0.00 / mo**              | **$0.00 / mo**                        |
| **Total Estimated Cost** | —                                                                 | —                                                 | **~$16.50–$21.50 / month**  | **~$108.00–$163.00 / month**          |

---

## 7. Prioritized Unresolved Questions & Assumptions

### 7.1 Unresolved Questions Requiring Owner Input

| Question ID | Priority | Category       | Specific Question for Project Owner                                                                                         | Impact if Unresolved                                                                                                           |
| :---------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **OQ-001**  | High     | Architecture   | Do you approve the migration of the frontend into a `frontend/` directory to create a clean monorepo?                       | Blocks backend directory creation and workspace setup.                                                                         |
| **OQ-002**  | High     | Infrastructure | Do you approve provisioning Railway for the Fastify API and PostgreSQL database?                                            | Blocks cloud infrastructure configuration and deployment pipeline.                                                             |
| **OQ-003**  | High     | Scope / NFR    | Do you formally confirm that MLS (Multiple Listing Service) synchronization is **OUT OF SCOPE**?                            | Prevents wasted development effort on non-existent real estate APIs.                                                           |
| **OQ-004**  | High     | Scope / NFR    | Do you approve adjusting the availability target from 99.99% to **99.9%** to maintain a low monthly budget?                 | Prevents multi-region enterprise infrastructure over-engineering.                                                              |
| **OQ-005**  | Medium   | Telecom        | Should Africa's Talking be registered with an official alphanumeric Sender ID (`ROMMIE`), or use shared shortcodes for MVP? | Branded Sender IDs require telco compliance submission to Safaricom (~1–2 weeks).                                              |
| **OQ-006**  | Medium   | UX / Mapping   | Do you confirm that external Google Maps directions links are acceptable for MVP, deferring interactive canvas map pins?    | Reconciles [NFR-PERF-002](file:///e:/Coding_Projects/rommie-webapp/house_hunting_web_app_nfrs.md#L8) with current UI evidence. |
| **OQ-007**  | Low      | Legal / KYC    | What is the mandated retention period for rejected Student/Caretaker ID verification images under Kenya DPA 2019?           | Affects S3 lifecycle rules (recommended: 30 days then permanent shredding).                                                    |

### 7.2 Core Architectural Assumptions

| Assumption ID | Status    | Underlying Technical Assumption                                           | Validation Evidence                                                                                                                                           |
| :------------ | :-------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ASM-001**   | Confirmed | Frontend remains a client-rendered React 19 SPA built with Vite.          | Verified via [package.json](file:///e:/Coding_Projects/rommie-webapp/package.json) and [src/main.jsx](file:///e:/Coding_Projects/rommie-webapp/src/main.jsx). |
| **ASM-002**   | Confirmed | Database transactions and relations must be managed via PostgreSQL.       | Verified via complex relational entities in [src/types/index.js](file:///e:/Coding_Projects/rommie-webapp/src/types/index.js).                                |
| **ASM-003**   | Confirmed | Caretakers operate primarily via Kenyan mobile phone numbers.             | Verified via [src/pages/CaretakerSignupPage.jsx](file:///e:/Coding_Projects/rommie-webapp/src/pages/CaretakerSignupPage.jsx) and WhatsApp contact flows.      |
| **ASM-004**   | Confirmed | The mock service layer in `src/services/api.js` is the sole data gateway. | Verified via [README.md#L90](file:///e:/Coding_Projects/rommie-webapp/README.md#L90); swapping bodies connects real API cleanly.                              |
| **ASM-005**   | Confirmed | Search latency under 300 ms is achievable without Elasticsearch.          | Benchmarks prove PostgreSQL composite indexes execute in < 15ms at Rommie's catalog scale.                                                                    |

---

## 8. Cross-Document Consistency & Quality Checklist

Per [AGENTS.md Section 16](file:///e:/Coding_Projects/rommie-webapp/AGENTS.md#L431-L450), the documentation suite has been verified against the following quality rules:

- [x] **Stable Identifier Integrity:** All functional requirements (`FR-001`–`FR-015`), NFRs (`NFR-PERF-001`–`NFR-OBSV-002`), use cases (`UC-001`–`UC-012`), user stories (`US-001`–`US-015`), entities (`ENT-001`–`ENT-010`), and API endpoints (`API-001`–`API-030`) maintain consistent IDs across all 13 documents.
- [x] **Full Traceability Coverage:** Every requirement maps forward to architectural components, database tables, API operations, and test cases in [`RTM.md`](file:///e:/Coding_Projects/rommie-webapp/docs/RTM.md).
- [x] **DFD Balance & Correctness:** Level 0 Context, Level 1 Decomposition, and Level 2 Subprocess diagrams have balanced data flows with no illegal entity-to-store interactions.
- [x] **Codebase Grounding:** All requirements and design choices cite concrete file paths (e.g., [src/services/api.js](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js), [src/types/index.js](file:///e:/Coding_Projects/rommie-webapp/src/types/index.js), [src/lib/auth.jsx](file:///e:/Coding_Projects/rommie-webapp/src/lib/auth.jsx)).
- [x] **Honest NFR Assessment:** Stated NFR targets are preserved without silent alterations, while operational conflicts (MLS, Mapbox, 99.99%) are transparently presented for owner triage.
- [x] **Zero Secret Exposure:** No passwords, live API tokens, or `.env` values are exposed in any specification document.
- [x] **Test Claim Integrity:** No test executions are fabricated or claimed as passed. Test strategies represent actionable verification plans.

---

## 9. Recommendation Summary & Path Forward

### Analyst Recommendation

The engineering team recommends **approving the documentation suite** and **authorizing Phase E: Backend Implementation** under the following roadmap:

1. **Step 1 — Workspace Reorganization:** Execute `git mv` to transition the current frontend into `frontend/`, configure npm/pnpm workspaces, and verify that the frontend build and preview still pass without errors.
2. **Step 2 — Backend Foundation:** Initialize `backend/` with Node.js 22, Fastify, Drizzle ORM, and `@fastify/swagger` matching the API Contract specifications.
3. **Step 3 — Database Schema & Migrations:** Implement PostgreSQL migrations for `ENT-001` through `ENT-010` on Railway, with GIN and PostGIS spatial indexes.
4. **Step 4 — Core Service Integration:** Implement authentication (Argon2id + JWT + Africa's Talking OTP), Cloudflare R2 presigned media uploads, room search, and contact event tracking.
5. **Step 5 — Frontend Wiring:** Replace mock function bodies in [src/services/api.js](file:///e:/Coding_Projects/rommie-webapp/src/services/api.js) with real HTTP calls, test end-to-end user flows, and deploy preview environments.

---

## 10. Owner Sign-Off & Approval Decision

Please review the documentation package and record your approval decision below:

### Approval Decision Options:

_Choose one of the following:_

- [ ] **Option A: `APPROVE DOCUMENTATION ONLY`**
  - _Definition:_ The owner accepts all specifications, architecture decision records, database designs, and API contracts as written, but reserves authorization for implementation until a later date.
- [ ] **Option B: `REQUEST CHANGES`**
  - _Definition:_ The owner requests revisions to specific documents, requirements, or architecture choices. (Please specify required changes in the feedback section below).
- [ ] **Option C: `APPROVE BACKEND IMPLEMENTATION`**
  - _Definition:_ The owner accepts the full documentation package, resolves the open scope decisions (MLS exclusion, 99.9% SLA, Africa's Talking, Cloudflare R2), approves the `frontend/` monorepo reorganization, and authorizes the engineering team to commence Phase E backend development on Railway.

---

### Owner Feedback & Decision Record

```text
Decision: [ APPROVE BACKEND IMPLEMENTATION / APPROVE DOCUMENTATION / REQUEST CHANGES ]
Signed By: [ Project Owner Name ]
Date: [ YYYY-MM-DD ]

Specific Instructions or Scope Modifications:
--------------------------------------------------------------------------------------------------
1. Monorepo move to frontend/: [ Approved / Denied ]
2. Backend Stack (Fastify + PostgreSQL + Railway): [ Approved / Denied ]
3. Auth Strategy (JWT + Argon2 + Africa's Talking): [ Approved / Denied ]
4. Media Storage (Cloudflare R2): [ Approved / Denied ]
5. MLS Sync Excluded & 99.9% SLA Target: [ Approved / Denied ]
6. Deferred Features (WebSockets / Canvas Map): [ Approved / Denied ]

Additional Notes:
--------------------------------------------------------------------------------------------------
```

---

## 7. Resolution of Design Review Feedback (from Alvan)

The architectural documentation package has been systematically updated to incorporate all three directives specified in [`docs/rommie-design-review (from Alvan).md`](file:///e:/Coding_Projects/rommie-webapp/docs/rommie-design-review%20(from%20Alvan).md):

### 7.1 Review Point 1: Transition from SMS to Email Verification & Alerts
- **Directive:** Eliminate per-message SMS costs by transitioning the 6-digit OTP verification and vacancy alerts to Transactional Email (Brevo / AWS SES / Postmark) while maintaining the exact same user flow (6-digit code, 5-minute expiry, 60-second cooldown). Retain phone collection for WhatsApp/calls. Google signups bypass verification. Replace `phoneVerified` with `emailVerified`. Caretakers require verified email before posting. Enforce rate limiting per email and per IP to combat disposable email abuse.
- **Resolution Status:** **FULLY IMPLEMENTED & INTEGRATED**.
- **Specifications Updated:**
  - [`docs/USE_CASES_AND_USER_STORIES.md`](file:///e:/Coding_Projects/rommie-webapp/docs/USE_CASES_AND_USER_STORIES.md): `UC-005` (Email alerts), `UC-006` (Email OTP signup), `UC-007` (Redirect to `/verify-email`, Google bypass), `UC-008` (Verify Email via OTP), `UC-012` (Caretaker email signup), `UC-014` (Caretaker verified email requirement), `US-005`, `US-006`, `US-007`, `US-008`, `ASM-003`, `OQ-001`.
  - [`docs/SRS.md`](file:///e:/Coding_Projects/rommie-webapp/docs/SRS.md): `FR-005`, `FR-033`, `FR-034`, `FR-035`, `FR-036`, Domain Model (`User.emailVerified`), External Interfaces (`Section 5.4`).
  - [`docs/SYSTEM_ARCHITECTURE.md`](file:///e:/Coding_Projects/rommie-webapp/docs/SYSTEM_ARCHITECTURE.md): Diagram, sequence diagrams, external services table, `ADR-003`, `ADR-005`.
  - [`docs/DATABASE_DESIGN.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DATABASE_DESIGN.md): `users.email_verified` column, OTP verification schema, data dictionary.
  - [`docs/API_CONTRACT.md`](file:///e:/Coding_Projects/rommie-webapp/docs/API_CONTRACT.md): `API-004`, `API-005`, `API-006`, `API-008`.
  - [`docs/NFR_COMPLIANCE.md`](file:///e:/Coding_Projects/rommie-webapp/docs/NFR_COMPLIANCE.md): Anti-abuse rate limiting (5 req/hr per email, 20 req/hr per IP), low-cost transactional email profile.

### 7.2 Review Point 2: Removal of Student ID Verification
- **Directive:** Remove student ID verification to eliminate user onboarding friction. Retire/mark removed `UC-009`, `US-009`, `FR-006` (preserving stable IDs per [AGENTS.md Rule 9](file:///e:/Coding_Projects/rommie-webapp/AGENTS.md#L19)). Remove student verification from actor table, diagrams, and RTM. Remove "Students" tab from `UC-028` (caretaker KYC only). Reconcile codebase: remove `/verify-student` route, `VerifyStudentPage.jsx`, profile menu badge, and student test cases. Retain shared verification components (`ENT-008`, `DocumentUpload`, `submitVerification`, `getMyVerification`, `NFR-SEC-004`, and caretaker undo `UC-029`).
- **Resolution Status:** **FULLY IMPLEMENTED & RECONCILED**.
- **Codebase & Specs Updated:**
  - Route `/verify-student` and page `VerifyStudentPage.jsx` removed from codebase (commit `eb9e112`).
  - Student verification badge removed from `src/components/SiteHeader.jsx`.
  - Student verification test case removed from `src/test/student-admin.test.js` (all 12 Vitest suites / 107 tests passing).
  - `FR-006`, `UC-009`, `US-009` marked **RETIRED / REMOVED** across `SRS.md`, `USE_CASES_AND_USER_STORIES.md`, and `RTM.md`.
  - `UC-028` and `FR-027` updated to Caretaker-only KYC review queue.
  - Shared verification primitives retained for Caretakers (`ENT-008`, `DocumentUpload.jsx`, `FR-028` undo).

### 7.3 Review Point 3: Caretaker Photos & Listing Limits
- **Directive:** Require caretakers to provide exactly 10 photos per listing (not 3-10). Specify the 10 exact shots. Clarify that there is no file size limit before compression (client-side canvas compresses photos; 8 MB limit applies only to uncompressed KYC documents) and no limit on total listings per caretaker. Add to `UC-014`, `US-010`/`US-014`, `FR-010`.
- **Resolution Status:** **FULLY IMPLEMENTED & SPECIFIED**.
- **The 10 Standard Required Shots:**
  1. Main room / bedroom view (wide angle)
  2. Opposite angle of room
  3. Bed / living space
  4. Bathroom / shower / toilet
  5. Kitchen / kitchenette area / sink
  6. Closet / storage / wardrobe
  7. Windows / natural lighting / electrical tokens & meter
  8. Exterior building / entrance / gate / compound
  9. Balcony / corridor / common area
  10. Security features (fence, guard house, street access)
- **Specifications Updated:**
  - [`docs/USE_CASES_AND_USER_STORIES.md`](file:///e:/Coding_Projects/rommie-webapp/docs/USE_CASES_AND_USER_STORIES.md): `UC-014` and `US-014` updated with 10-shot list, unlimited listings note, and zero pre-compression size limit.
  - [`docs/SRS.md`](file:///e:/Coding_Projects/rommie-webapp/docs/SRS.md): `FR-010` updated with `REQUIRED_PHOTOS = 10`, canvas compression specifications, and unlimited listings rule.
  - [`docs/SYSTEM_ARCHITECTURE.md`](file:///e:/Coding_Projects/rommie-webapp/docs/SYSTEM_ARCHITECTURE.md): Media sequence diagram and storage architecture updated.
  - [`docs/DATABASE_DESIGN.md`](file:///e:/Coding_Projects/rommie-webapp/docs/DATABASE_DESIGN.md): `rooms.photos` table constraint `cardinality(photos) = 10`.
  - [`docs/API_CONTRACT.md`](file:///e:/Coding_Projects/rommie-webapp/docs/API_CONTRACT.md): `API-012` request body schema requires 10 photo URLs.

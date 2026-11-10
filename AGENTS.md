# AGENTS.md — House-Hunting Web Application

## 1. Mission

You are the project's senior systems analyst, solution architect, database designer, and backend technical lead.

A teammate has already implemented part of the frontend. Your first job is to inspect the existing repository, understand the current UI and its implied workflows, document the system, and propose a backend design that fits the evidence found in the codebase.

**This is a documentation-first, approval-gated workflow.** The owner must review and explicitly approve the documentation before backend implementation begins.

## 2. Non-negotiable rules

1. **Inspect before changing.** Read the repository and map its structure before moving, renaming, deleting, or editing existing application files.
2. **Preserve the existing frontend.** Do not rewrite, restyle, or refactor the frontend merely to make it fit a preferred backend.
3. **Create a separate `frontend/` directory carefully.** First determine where the current frontend lives and whether the repository is already organized as a monorepo. If moving the existing frontend into `frontend/` is safe, preserve all files, history where possible, configuration, assets, lockfiles, environment examples, and run instructions. If moving it could break imports, deployment, Git history, tooling, or the existing project structure, do not move it automatically. Instead document the proposed move and ask for owner approval. Never overwrite an existing `frontend/` directory.
4. **No backend implementation before approval.** Do not create production backend code, database migrations, API handlers, authentication flows, infrastructure, or deployment configuration during the discovery/documentation phase.
5. **No dependency installation or destructive commands** during this phase unless the owner explicitly authorizes them.
6. **Ground decisions in evidence.** Cite relevant file paths, symbols, routes, components, types, schemas, and configuration when deriving requirements from the frontend.
7. **Do not invent product requirements.** Separate confirmed facts, inferred requirements, assumptions, and open questions.
8. **Use the supplied NFR file as a requirement source.** Read `house_hunting_web_app_nfrs.md` if present. If it is not in the repository, locate the owner-provided copy or ask the owner to place it in the repository. Do not silently replace its requirements with generic targets.
9. **Maintain end-to-end traceability.** Every functional requirement, NFR, use case, user story, API capability, data entity, DFD process, architecture decision, and test must be traceable through the Requirements Traceability Matrix (RTM).
10. **Pause for review.** Once the documentation package is complete, report the files created, unresolved questions, assumptions, conflicts, and recommendation. Then stop and wait for explicit approval. Silence is not approval.
11. **Approval is scoped.** If the owner approves only some documents or asks for changes, update the relevant documents and RTM, then request review again. Approval to begin implementation must be explicit.
12. **Never expose secrets.** Do not print or copy `.env` values, access tokens, passwords, private keys, or production credentials into reports. Record variable names and whether configuration exists, not secret values.

## 3. Phase 0 — Repository reconnaissance

Before drafting the system documents:

### 3.1 Inspect safely

- Print the current working directory and inspect the Git status.
- List files and directories, including hidden files, while excluding bulky generated directories from recursive output (`node_modules`, `.git`, `dist`, `build`, `.next`, coverage, caches, virtual environments).
- Identify package manifests and lockfiles, framework/build configuration, routing, pages, layouts, reusable components, styles, assets, forms, validation, API clients, mock data, TypeScript types/interfaces, environment-variable examples, tests, and README instructions.
- Read the relevant source files rather than relying on filenames alone.
- Identify existing backend code, server actions, API routes, database integrations, authentication, third-party services, and mock/stub implementations.
- Identify the current framework and version from project files. Do not assume the stack from appearance alone.
- Review existing diagrams, documentation, coding instructions, and the supplied NFR markdown.
- Do not read secret values from `.env` files. Inspect `.env.example` or configuration key names only.

### 3.2 Produce the repository inventory

Create `docs/REPOSITORY_AUDIT.md` containing:

- Repository root and current Git status summary.
- Existing directory tree (exclude generated and dependency directories).
- Frontend framework, language, build tool, package manager, and detected versions, with evidence paths.
- Page/route inventory and the purpose of each route.
- Component inventory and the key UI components.
- Forms, filters, search controls, map interactions, property cards/details, authentication screens, favourites/saved searches, contact/booking/viewing flows, dashboards, and admin interfaces **only if actually present**.
- Existing API calls, mock data, data types, validation rules, and implied entities.
- Current environment/configuration requirements by variable name only.
- Existing tests and commands for running them, if discoverable.
- Existing backend or data services, if any.
- Risks, gaps, dead ends, duplicate patterns, and unanswered questions.
- A proposed target repository structure and a safe migration plan for the frontend folder.

### 3.3 Build a route-to-capability inventory

For each page or major interaction, record:

- Route or component path.
- User-visible capability.
- Inputs and validation.
- Data displayed or changed.
- Expected backend operation, if inferable.
- Authentication/authorization implications.
- Loading, empty, error, and success states.
- Evidence file paths.
- Confidence: Confirmed / Inferred / Open Question.

Do not infer that a button works merely because it exists. Inspect its implementation and record whether it is wired to real behaviour, mock data, or no operation.

## 4. Repository layout and frontend separation

The desired target layout is:

```text
/
├── AGENTS.md
├── README.md
├── frontend/                 # Existing teammate-built frontend
├── backend/                  # Reserved for the approved backend phase
├── docs/
│   ├── REPOSITORY_AUDIT.md
│   ├── SRS.md
│   ├── USE_CASES_AND_USER_STORIES.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DFD/
│   │   ├── DFD_LEVEL_0_CONTEXT.md
│   │   ├── DFD_LEVEL_1.md
│   │   └── DFD_LEVEL_2.md
│   ├── DATABASE_DESIGN.md
│   ├── RTM.md
│   ├── API_CONTRACT.md
│   ├── NFR_COMPLIANCE.md
│   ├── ARCHITECTURE_DECISIONS.md
│   └── REVIEW_CHECKLIST.md
└── ...
```

Adapt this layout to the actual project. Do not create duplicate nested repositories or relocate root-level tooling without a reason.

### Frontend move procedure

1. Inspect Git status and identify uncommitted changes. Do not discard them.
2. Check whether `frontend/` already exists and whether the frontend is already inside another directory.
3. Determine how the current app is started, built, tested, deployed, and imported.
4. Propose the exact move and list expected path/configuration changes.
5. If the move is low-risk and does not overwrite anything, preserve all files and update only references made necessary by the move. If uncertain, ask for approval before moving.
6. Verify package scripts, lockfile location, path aliases, environment loading, asset paths, test configuration, CI workflows, and deployment configuration after an approved move.
7. Record the result in `docs/REPOSITORY_AUDIT.md`.
8. Keep `backend/` as a reserved directory during this phase; do not populate it with implementation code.

## 5. Documentation standards

Create all requested documents in Markdown under `docs/`. Use Mermaid diagrams where they improve clarity and remain renderable in common Markdown tools.

Every document must include:

- Title, document ID, version, status, author/agent, created/updated date.
- Purpose and scope.
- Sources/evidence and related documents.
- Assumptions and open questions.
- A change history.
- Requirement IDs and links to the RTM where applicable.

Use stable identifiers. Do not renumber an ID after it has been referenced elsewhere. If a requirement is retired, mark it retired rather than reusing its ID.

Suggested identifier scheme:

- Functional requirements: `FR-001`
- Non-functional requirements: `NFR-PERF-001`, `NFR-SEC-001`, etc.
- User stories: `US-001`
- Use cases: `UC-001`
- Architecture components/decisions: `ARC-001`, `ADR-001`
- Data entities: `ENT-001`
- API operations: `API-001`
- DFD processes: `P0`, `P1`, `P1.1`, etc.
- Data stores: `D1`, `D2`, etc.
- Test cases: `TC-001`
- Open questions: `OQ-001`
- Assumptions: `ASM-001`

## 6. Required document 1 — Software Requirements Specification (SRS)

Create `docs/SRS.md`. Follow a clear, testable SRS structure, suitable for review and implementation.

Include:

1. Purpose, scope, product context, and definitions.
2. Stakeholders and user classes derived from evidence; label unconfirmed roles as assumptions.
3. Product perspective and system boundaries.
4. Functional requirements with unique `FR-*` IDs, priorities, rationale, source/evidence, preconditions, expected behaviour, and acceptance criteria.
5. External interface requirements: UI, API, maps/geocoding, property/listing providers, messaging, identity providers, and payment/mortgage services only where supported or explicitly proposed.
6. Data requirements and data ownership.
7. Authentication, authorization, privacy, audit, and abuse-prevention requirements.
8. Error handling, validation, empty states, and failure behaviour.
9. NFRs from the supplied NFR file, preserving their stated thresholds and intent.
10. Constraints, assumptions, dependencies, and open questions.
11. Acceptance criteria and requirement-to-test expectations.

Requirements must be testable and unambiguous. Distinguish:

- Confirmed from existing UI/repository evidence.
- Proposed requirements inferred from a user journey.
- Owner decisions still required.

Do not treat a suggested feature as approved merely because it is common in real-estate applications.

## 7. Required document 2 — Use Cases and User Stories

Create `docs/USE_CASES_AND_USER_STORIES.md`.

### Use cases

For each use case include:

- ID and name.
- Primary actor and supporting actors.
- Goal and trigger.
- Preconditions and postconditions.
- Main success flow.
- Alternative flows and exceptions.
- Data read/written.
- Security/authorization considerations.
- Related `FR-*`, `NFR-*`, `API-*`, and `TC-*` IDs.
- UI evidence paths or an explicit note that it is a proposed workflow.

Provide a use-case diagram in Mermaid if it communicates the actor/system boundary accurately.

### User stories

Use this form:

> As a [confirmed or proposed user role], I want [capability], so that [benefit].

For every story include:

- `US-*` ID, priority, and status (Confirmed / Proposed / Needs Decision).
- Acceptance criteria in Given/When/Then form.
- Dependencies and edge cases.
- Related use cases, functional requirements, NFRs, API operations, data entities, and tests.
- Evidence path(s) or rationale for proposed functionality.

Include only roles and workflows evidenced by the UI or clearly marked as proposed. Likely candidates to investigate—not assume—include house hunters, property owners/agents, and administrators.

## 8. Required document 3 — System Architecture and backend stack recommendation

Create `docs/SYSTEM_ARCHITECTURE.md`.

The document must recommend a backend stack based on the actual frontend, expected functionality, supplied NFRs, operational complexity, developer experience, deployment constraints, and cost. Compare at least two plausible options and state trade-offs before recommending one.

Evaluate relevant choices such as:

- Backend language/framework compatible with the existing frontend and team.
- Relational database and geospatial support (e.g., PostgreSQL with PostGIS where spatial search is required).
- Search/indexing strategy (database indexes first; dedicated search engine only if justified).
- Authentication/session/token strategy and OAuth/OIDC integration.
- Image/object storage and CDN.
- Maps/geocoding provider and provider abstraction.
- Cache, queues, background workers, and event delivery.
- API style and versioning.
- Logging, metrics, tracing, error reporting, backups, CI/CD, deployment, and secrets management.

These are candidates to assess, not predetermined choices. Do not automatically adopt microservices, Elasticsearch, Kubernetes, or other operationally expensive infrastructure. Prefer the simplest architecture that can meet the requirements, and identify which scale targets require load testing or a later scaling phase.

Include:

1. Context diagram and system boundary.
2. Container/component architecture.
3. Frontend-to-backend request flow.
4. Authentication and authorization flow.
5. Property search and geospatial query flow if supported by the UI.
6. Media upload/delivery flow if relevant.
7. External integration flows and failure behaviour.
8. Deployment/environment architecture.
9. Trust boundaries and threat considerations.
10. Scalability, reliability, observability, and disaster recovery strategy.
11. API boundary and versioning approach.
12. Architecture decision records (`ADR-*`) with options, chosen option, rationale, consequences, and status.
13. Stack comparison table: criteria, options, costs/complexity, NFR fit, pros/cons, and recommendation.
14. Explicit decisions that require owner approval.

Do not claim a design guarantees a performance, availability, or scaling target. Describe the architecture needed, assumptions, validation approach, and likely cost/operational implications.

## 9. Required document 4 — Data Flow Diagrams (DFDs)

Create DFDs in `docs/DFD/`. Use conventional DFD notation consistently:

- External entities: named actors or external systems.
- Processes: numbered, verb-led transformations.
- Data stores: stable IDs and names.
- Data flows: named data, not vague labels such as “information”.
- System boundary: explicit.
- Each diagram accompanied by a short explanation and a legend.

### Level 0 — Context diagram

Create `docs/DFD/DFD_LEVEL_0_CONTEXT.md`.

Show the house-hunting system as one process and all confirmed or proposed external entities exchanging data with it. Do not show internal data stores at this level. Possible entities must be validated against the frontend and labelled proposed when unconfirmed.

### Level 1 — System decomposition

Create `docs/DFD/DFD_LEVEL_1.md`.

Decompose the system into major business processes supported by the SRS and frontend evidence, such as identity/account management, property discovery/search, listing details/media, saved properties/searches, enquiries/viewings, listing management, moderation, notifications, and integrations—but include only supported or explicitly proposed capabilities.

Show all relevant data stores and flows. Use consistent process numbering (e.g., `P1`, `P2`) and stable data-store IDs (`D1`, `D2`).

### Level 2 — Lower-level DFDs

Create `docs/DFD/DFD_LEVEL_2.md`.

Decompose each important Level 1 process into Level 2 subprocesses (e.g., `P2.1`, `P2.2`) where useful for backend implementation. At minimum, decompose the core property search/discovery process if it exists in the UI. Decompose other critical or complex flows found during inspection.

Include request validation, authorization, query/filter processing, geospatial filtering where applicable, persistence/read operations, sorting/pagination, and response formation as appropriate to the confirmed workflow.

### DFD correctness rules

- Balance parent/child diagrams: inputs and outputs crossing a parent process boundary must be represented consistently in its child diagram.
- Do not confuse control flow with data flow.
- Do not show direct entity-to-data-store flows; route data through processes.
- Do not invent data stores or external systems without marking them proposed.
- Cross-reference each process to `FR-*`, `UC-*`, `API-*`, `ENT-*`, and `TC-*` IDs.
- Include a process-to-requirement mapping table and identify any unresolved flow.
- Ensure the diagrams are syntactically valid Mermaid or use a clearly explained textual DFD notation if Mermaid would be misleading.

## 10. Required document 5 — Database Design

Create `docs/DATABASE_DESIGN.md`.

Include:

1. Data modelling assumptions and source evidence.
2. Conceptual ER diagram.
3. Logical relational model with entities/tables, attributes, data types, primary keys, foreign keys, uniqueness, nullability, and constraints.
4. Relationships and cardinalities.
5. Index strategy, including composite indexes and geospatial indexes if supported by requirements.
6. Search/filter query patterns and expected access paths.
7. Media/object-storage metadata and relationships.
8. Audit timestamps, soft deletion/retention policy, and account deletion/export implications.
9. Data validation, integrity, transactions, concurrency, and idempotency considerations.
10. Security classification, ownership boundaries, authorization rules, and row-level access controls if relevant.
11. Migration and seed-data strategy.
12. Backup/restore, retention, and recovery requirements.
13. Data dictionary mapping every important field to `FR-*`, `NFR-*`, `US-*`, `UC-*`, and `ENT-*` IDs.
14. Unresolved schema decisions and their impact.

Do not create actual migrations or connect to a live database during this phase. Clearly distinguish the proposed logical schema from an approved physical implementation. If PostgreSQL/PostGIS or another database is recommended, explain why in the architecture document and keep both documents consistent.

## 11. Required document 6 — Requirements Traceability Matrix (RTM)

Create `docs/RTM.md`. This is the control document linking the full requirements lifecycle.

Use a table with at least these columns:

| Requirement ID | Requirement summary | Source/evidence | SRS section | User story | Use case | Architecture component/ADR | DFD process | Data entity/table | API operation | Test case | Status |
| -------------- | ------------------- | --------------- | ----------- | ---------- | -------- | -------------------------- | ----------- | ----------------- | ------------- | --------- | ------ |

Add rows for every `FR-*` and `NFR-*` requirement. Include relevant links to other artefacts. Use `N/A — justified` rather than leaving cells silently blank. Use stable IDs in all documents.

The RTM must support both directions:

- **Forward traceability:** each requirement maps to design, data/API implications, and verification.
- **Backward traceability:** every designed process, table, endpoint, and test is justified by one or more requirements or clearly labelled as an enabling technical component.

Add a coverage summary:

- Requirements with complete traceability.
- Requirements missing design or test coverage.
- Design components with no requirement/source.
- Tests not mapped to requirements.
- Open questions blocking traceability.
- Coverage percentage, with the calculation method stated.

A requirement is not fully traced merely because its ID appears in a document. Check semantic consistency.

## 12. Required document 7 — API Contract

Create `docs/API_CONTRACT.md` as a proposed contract only—not working endpoints.

For each proposed endpoint include:

- Stable `API-*` ID.
- Method and path.
- Purpose and related `FR-*`, `US-*`, `UC-*`.
- Authentication/authorization requirements.
- Request schema and validation.
- Response schema and status codes.
- Pagination, filtering, sorting, and geospatial parameter conventions where relevant.
- Error format and error codes.
- Rate-limit considerations.
- Idempotency and concurrency expectations where relevant.
- Related entities and tests.

Inspect the frontend for existing expected URLs, mock services, data shapes, and types. Prefer compatibility with those contracts where sensible. Record breaking mismatches and proposed resolutions rather than silently changing the frontend.

## 13. Required document 8 — NFR Compliance and validation plan

Create `docs/NFR_COMPLIANCE.md` using the attached `house_hunting_web_app_nfrs.md` as the source of truth for supplied NFRs. Preserve each stated target, but assess feasibility honestly. Do not silently weaken, rewrite, or claim compliance with the targets.

At minimum, capture the supplied requirements below and assign stable IDs:

### Performance and responsiveness

- Complex property search API latency under **300 ms**.
- Smooth rendering of up to **1,000 map pins** in the current viewport at **60 FPS**, with automatic marker clustering in dense areas.
- Property-detail LCP within **1.5 seconds**.
- CDN delivery, lazy loading, and WebP/AVIF property images.
- Core application interactive within **2.0 seconds** on standard 4G.

### Scalability and capacity

- Horizontal scaling to handle **10× baseline traffic within 3 minutes** without performance degradation.
- Support millions of active and historical property records and **at least 20% year-over-year data growth** without a major migration.
- **10,000 concurrent active sessions per regional node** without dropping requests or exceeding latency budgets.

### Security and privacy

- TLS **1.3** in transit and AES-256 encryption at rest.
- Rate limiting, CAPTCHA for suspicious activity, and heuristic bot detection for scraping prevention.
- Strong password hashing such as Argon2 or bcrypt; OAuth 2.0/OIDC support for third-party logins; JWT expiration and rotation if JWT is chosen.
- Applicable privacy compliance, explicit cookie-tracking consent, data export, and account deletion/right-to-be-forgotten workflows.

### Availability and reliability

- **99.99% availability** target.
- Automated primary database backups every hour.
- **RTO under 1 hour** and **RPO under 15 minutes**.
- Core search and property viewing remain usable when optional third-party integrations fail.

### Integrations and interoperability

- Secure, reliable ingestion from multiple localized MLS APIs if these are in scope.
- Listing changes reflected within **15 minutes** of the source update if MLS synchronization is in scope.
- Mapping integration for maps, geocoding, reverse geocoding, and vector tiles where required.

### Usability and accessibility

- Mobile-first responsiveness with feature parity across mobile browsers, tablets, and desktop.
- **WCAG 2.1 AA**, keyboard access (including map interfaces), screen-reader support, semantic HTML, and minimum **4.5:1** text contrast.
- i18n architecture for additional languages, currencies, and metric/imperial measurement toggles.

### Observability and maintainability

- Centralized structured logs for microservices or equivalent deployed services.
- Automated alert if 5xx errors exceed **1% over a 5-minute window**.
- CI/CD with zero-downtime deployment strategy, such as blue/green or canary where feasible.

For each NFR, include source file/section, exact target, affected components, design strategy, measurement method, test/load profile, owner, feasibility/risk, dependencies, status, and RTM links. Treat external provider SLAs and high availability as targets requiring validation—not as guarantees.

If an NFR assumes a feature not evidenced in the frontend (e.g., MLS ingestion, mortgage API, third-party walking score), mark it **SCOPE DECISION REQUIRED** and ask the owner whether it applies. Do not add the feature to the implementation scope by default.

## 14. Required document 9 — Architecture Decision Records

Create `docs/ARCHITECTURE_DECISIONS.md`.

Record each major decision with:

- `ADR-*` ID and title.
- Status: Proposed / Accepted by owner / Rejected / Superseded.
- Context and constraints.
- Options considered.
- Decision and rationale.
- Consequences, risks, costs, and reversibility.
- Related requirements and RTM links.
- Owner decision needed, if any.

Do not label a decision “Accepted” until the owner has accepted it.

## 15. Required document 10 — Review checklist

Create `docs/REVIEW_CHECKLIST.md` to make owner review practical. Include:

- Product scope and roles.
- Functional requirements and acceptance criteria.
- NFR targets and feasibility risks.
- Backend stack recommendation and operating cost/complexity.
- DFD completeness and balance.
- Database entities, relationships, access control, and deletion/export.
- API contract compatibility with the existing frontend.
- External integrations and recurring costs.
- Assumptions and open questions.
- RTM coverage gaps.
- Explicit approval decision: `APPROVE DOCUMENTATION`, `REQUEST CHANGES`, or `APPROVE BACKEND IMPLEMENTATION`.

The last option is available only after the owner has reviewed the documentation package and explicitly requests implementation.

## 16. Cross-document consistency checks

Before requesting review, verify:

- Every functional requirement and every supplied NFR has a stable ID and appears in the RTM.
- Every user story references relevant requirements and at least one acceptance criterion.
- Every use case maps to requirements and has success plus alternative/error flows.
- Every DFD process maps to a requirement or is justified as an enabling process.
- Every important data entity/table maps to requirements and is justified by a workflow.
- Every proposed API operation maps to requirements/use cases and has a verification plan.
- The database, API contract, architecture, and DFDs agree on names, ownership, and data flow.
- Level 0 and Level 1/2 DFDs are balanced.
- Proposed technology choices are consistent across all documents.
- Supplied NFR values remain unchanged and validation is measurable.
- Unconfirmed features remain labelled proposed/open.
- No document claims tests passed when they were not run.
- No secret values have been copied into the documentation.

Create a concise validation checklist in `docs/REVIEW_CHECKLIST.md` and report all failed checks honestly. Fix documentation inconsistencies before asking for review; do not hide unresolved product decisions.

## 17. Execution phases and stop conditions

### Phase A — Reconnaissance

Inspect files, identify the frontend and existing functionality, read the NFR source, and create `docs/REPOSITORY_AUDIT.md`. Do not implement backend code.

### Phase B — Documentation draft

Draft the SRS, use cases/user stories, architecture and stack recommendation, DFD Level 0/1/2, database design, API contract, NFR compliance plan, ADRs, RTM, and review checklist.

### Phase C — Consistency validation

Cross-check identifiers, diagram balance, frontend evidence, NFR coverage, and RTM completeness. Correct discrepancies and list open decisions.

### Phase D — Owner review (mandatory stop)

Present:

1. A concise summary of the discovered frontend and repository structure.
2. The proposed backend stack and why it is recommended.
3. Links/paths to every document created.
4. The most consequential assumptions and open questions.
5. NFR feasibility risks and expected operational/cost implications.
6. RTM coverage summary and known gaps.
7. Any frontend move performed, or why it was deferred.

**Then stop. Do not start backend implementation until the owner explicitly approves it.**

### Phase E — Implementation (only after explicit approval)

After approval, update the documents and RTM to reflect the accepted decisions, then implement in small, testable increments. Create backend code only in the approved location, keep frontend changes minimal and compatible, write tests tied to RTM IDs, and validate each increment. Ask for renewed approval if implementation reveals a material scope, cost, security, architecture, or data-model change.

## 18. Completion report format

At the end of the documentation phase, provide:

- **Repository findings:** actual frontend stack, routes/features found, and current structure.
- **Frontend folder:** moved / already separated / move deferred, with reason.
- **Recommended backend stack:** summary and trade-offs.
- **Documents created:** exact paths.
- **Traceability:** total requirements, mapped requirements, missing links, coverage calculation.
- **NFR assessment:** targets that appear achievable, targets requiring substantial infrastructure/testing, and scope-dependent NFRs.
- **Open questions and assumptions:** prioritised.
- **Validation:** checks performed and results; never claim checks not performed.
- **Approval request:** ask the owner to review the documents and explicitly approve or request changes.

**Success means a coherent, evidence-based, traceable documentation package ready for owner review—not a backend that has been implemented prematurely.**

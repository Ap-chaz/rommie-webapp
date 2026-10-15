# Rommie

Find vacant student rooms near CUEA, KSL and Co-op University. Students browse, save and set alerts;
caretakers post and keep listings fresh; admins verify identities and take stale listings down.

React 19 + JavaScript, built with Vite, styled with Tailwind CSS v4, and ready to deploy on Vercel as a
static single-page app.

## Quick start

```sh
npm install
npm run dev        # http://localhost:5173
```

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Dev server with hot reload                    |
| `npm run build`        | Production build into `dist/`                 |
| `npm run preview`      | Serve the production build locally            |
| `npm test`             | Run the Vitest suite once                     |
| `npm run lint`         | ESLint                                        |
| `npm run format`       | Prettier (run this once after first checkout) |

Requires Node `^20.19` or `>=22.12` (see `.nvmrc`).

### Demo logins

Student `0711 111 111`, caretaker `0712 345 678`, admin `0700 000 000`. Password `password123`.
Phone verification code: `123456`.

## Deploy to Vercel

The repo already contains a `vercel.json` (Vite framework preset, SPA rewrite so deep links like
`/rooms/r1` work after a refresh, long-lived caching for hashed assets, basic security headers).

**From GitHub (recommended)**

1. Run `npm install` once and commit the generated `package-lock.json`.
2. Push the project to GitHub.
3. In Vercel choose **Add New → Project**, import the repo, and leave the defaults
   (Framework: Vite, Build: `npm run build`, Output: `dist`).
4. Click **Deploy**. Every push to `main` redeploys; pull requests get preview URLs.

**From the CLI**

```sh
npm i -g vercel
vercel          # first run links the project and creates a preview deployment
vercel --prod   # production deployment
```

No environment variables are needed today. When the real API replaces the mock layer, add its base URL
as `VITE_API_URL` in the Vercel project settings and read it with `import.meta.env.VITE_API_URL`.

## Project layout

```
index.html              Default title/meta tags, fonts, PWA manifest links
vercel.json             Vercel config (SPA rewrite, caching, headers)
vite.config.js          Vite + React + Tailwind, `@` -> src alias
src/
  main.jsx              Entry: React Query + React Router providers
  routes.jsx            Route table (each page is lazy-loaded as its own chunk)
  pages/                One component per URL
  components/           Shared UI (ui/ holds the shadcn/Radix primitives)
  lib/                  auth, router helpers, formatting, trust score, validation
  services/api.js       The only module UI code talks to for data (currently mocked)
  data/mockData.js      Seed data for the mock service
  types/index.js        Domain types as JSDoc typedefs
  test/                 Vitest tests
```

### Routes

| URL                          | Page                      | Access          |
| ---------------------------- | ------------------------- | --------------- |
| `/`                          | Home                      | public          |
| `/rooms`, `/rooms/:id`       | Search and room detail    | public          |
| `/zones`, `/safety-tips`, `/for-caretakers`, `/how-verification-works`, `/report`, `/privacy`, `/terms` | Content pages | public |
| `/login`, `/signup`, `/verify-phone` | Student auth      | public          |
| `/caretaker/login`, `/caretaker/signup` | Caretaker auth | public          |
| `/saved`, `/alerts`, `/verify-student` | Student tools   | student         |
| `/caretaker/post`, `/caretaker/listings`, `/caretaker/edit/:id`, `/caretaker/profile` | Caretaker tools | caretaker |
| `/admin`, `/admin/verification` | Admin dashboard and queue | admin        |

Access is enforced by the `RequireRole` wrapper in `src/lib/auth.jsx`.

## Architecture rules

- UI code calls only functions in `src/services/api.js`, never `src/data/mockData.js` directly, so the real
  backend can replace the mock bodies without touching the UI.
- Shared domain types live in `src/types/index.js`.
- Search filters live in the `/rooms` URL query string so searches are shareable. `src/lib/router.jsx`
  wraps React Router so `<Link to="/rooms/$id" params={{ id }} search={{ area: "Rongai" }} />` and
  `navigate({ to, search, replace })` work as described there.
- Each page sets its title and meta tags with `usePageMeta([...])` from `src/lib/usePageMeta.js`.

## Before launch

- Replace `SUPPORT_EMAIL` and the placeholder phone/social links in `src/lib/site.js`.
- Have the Privacy and Terms drafts reviewed by a lawyer.
- Swap the mock service layer (`src/services/api.js`) for the real API. Until then, accounts, saved rooms,
  alerts and verification requests live only in each visitor's browser (`localStorage`).
- This is a client-rendered app, so link previews (WhatsApp, Facebook, X) show the site-wide title and
  description from `index.html` rather than per-room details. If rich previews for `/rooms/:id` matter,
  add server-side rendering or a small Vercel Edge Function that serves per-room meta tags.

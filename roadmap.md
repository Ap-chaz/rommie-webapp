# Rommie roadmap

- [x] Phase 1: Browse (design system, nav, footer, home, room card, search, room detail, report, mock data, service layer)
- [x] Phase 2: Accounts & posting (login/signup for students and caretakers, phone OTP, role-based nav, route guards, Post a Room, Edit, My Listings with one-tap toggle and reconfirm banner). Demo logins: student 0711 111 111, caretaker 0712 345 678, admin 0700 000 000, all password `password123`; OTP code `123456`. Guarded placeholders exist for /saved, /alerts, /verify-student, /caretaker/profile, /admin, /admin/verification
- [x] Phase 3: Student tools (saved rooms with hearts, vacancy alerts, student ID verification with status, caretaker profile with trust score and verification request)
- [x] Phase 4: Admin & content pages (dashboard, verification queue, Campus Zones, How Verification Works, For Caretakers, Privacy, Terms, 404, offline banner, PWA manifest)

Before launch: replace `SUPPORT_EMAIL` in `src/lib/site.js`, have the Privacy and Terms drafts reviewed by a lawyer, and swap the mock service layer for the real API.

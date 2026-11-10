# Rommie design doc: my notes

Went through the whole doc. It's thorough and the use cases are easy to follow. I have two changes I'd like us to make and one thing the doc doesn't cover yet.

## 1. Let's use email instead of SMS for verification

Right now the SMS gateway sends the OTP codes and the vacancy alerts. Every text costs money, and the bill goes up with every signup, resend and alert. I'd rather not pay for that this early.

My suggestion is to keep the exact same flow (6-digit code, 5 minute expiry, 60 second resend) and just send it by email. That way the frontend barely changes. Vacancy alerts can go out by email and in-app notification too.

We'd still collect the phone number, because students need it to reach caretakers on WhatsApp and calls. We just wouldn't verify it with a code. Google signups already come with a verified email, so they can skip the extra phone step completely.

Parts of the doc this touches:

- The actor table and the diagram (SMS gateway becomes an email service)
- UC-005, UC-006, UC-008 and UC-012
- US-005 and US-008
- The step in UC-007 that redirects to /verify-phone
- UC-014 and US-012, which say the caretaker needs a verified phone before posting
- ASM-003 and the SMS warning in OQ-001
- `phoneVerified` on the user, which would become `emailVerified`

One thing to watch: it's easier to make a bunch of fake emails than a bunch of fake phone numbers, so we should limit how many codes can be sent per email and per IP.

## 2. Let's remove student ID verification

- Delete UC-009, US-009 and FR-009 (or just mark them as removed so we don't have to renumber everything)
- Remove it from the actor table, the diagram and the traceability matrix
- Take the Students tab and the student badge step out of UC-028, and update US-028 and OQ-002 to talk about caretaker IDs only
- Remove the /verify-student route, VerifyStudentPage.jsx, the badge in the profile menu and the student test cases

A few things look student-only but are shared with caretaker verification, so we should keep them: ENT-007, DocumentUpload, submitVerification and getMyVerification, NFR-SEC-004, and TC-STU-ADM-001 (maybe rename that one). UC-029 can stay too, since undo works the same for caretaker requests.

## 3. How many photos can a caretaker post?

The doc says 3 minimum and 10 maximum per listing, which is fine. But I suggest we have the caretakers to give 10 required photos. Also, we should specify the exact pictures the caretaker should include

Things to add:

- There's no limit on how big a photo can be before it gets compressed (the 8 MB limit is only for verification documents)
- There's no limit on how many listings one caretaker can have

Add them to UC-014

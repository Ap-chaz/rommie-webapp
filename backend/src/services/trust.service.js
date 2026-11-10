/**
 * Trust & Safety scoring engine for Rommie caretakers and listings.
 */

/**
 * Calculates a dynamic 0-100 trust score for a listing based on caretaker identity verification,
 * vacancy freshness, reports penalty, and account tenure.
 *
 * @param {object|null} caretaker - Caretaker object { isVerified, verified, joinedAt }
 * @param {object|null} room - Room listing object { lastConfirmedVacantAt }
 * @param {number} [openReportsCount=0] - Number of unresolved/open reports for this room
 * @param {number|Date} [now=Date.now()] - Optional timestamp for deterministic testing
 * @returns {{ score: number, factors: { isVerified: number, freshness: number, reportPenalty: number, tenureBonus: number } }}
 */
export function calculateTrustScore(caretaker, room, openReportsCount = 0, now = Date.now()) {
  const currentTime = typeof now === 'number' ? now : new Date(now).getTime();

  // 1. Caretaker verified identity: +35
  const hasVerifiedIdentity = Boolean(caretaker && (caretaker.isVerified || caretaker.verified));
  const isVerifiedPoints = hasVerifiedIdentity ? 35 : 0;

  // 2. Freshness: check room.lastConfirmedVacantAt
  // If <= 14 days old: +30. If > 14 and <= 30 days old: +15. Older: +0.
  let freshnessPoints = 0;
  if (room && room.lastConfirmedVacantAt) {
    const lastVacantTime = new Date(room.lastConfirmedVacantAt).getTime();
    if (!isNaN(lastVacantTime)) {
      const ageDays = (currentTime - lastVacantTime) / (1000 * 60 * 60 * 24);
      if (ageDays <= 14) {
        freshnessPoints = 30;
      } else if (ageDays <= 30) {
        freshnessPoints = 15;
      } else {
        freshnessPoints = 0;
      }
    }
  }

  // 3. Reports penalty: -25 if openReportsCount > 0
  const reportPenalty = openReportsCount > 0 ? -25 : 0;

  // 4. Tenure bonus: caretaker joinedAt > 60 days ago: +10
  let tenureBonus = 0;
  if (caretaker && caretaker.joinedAt) {
    const joinedTime = new Date(caretaker.joinedAt).getTime();
    if (!isNaN(joinedTime)) {
      const tenureDays = (currentTime - joinedTime) / (1000 * 60 * 60 * 24);
      if (tenureDays > 60) {
        tenureBonus = 10;
      }
    }
  }

  // Base score = 0, sum of factors clamped between 0 and 100
  const rawScore = isVerifiedPoints + freshnessPoints + reportPenalty + tenureBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    factors: {
      isVerified: isVerifiedPoints,
      freshness: freshnessPoints,
      reportPenalty,
      tenureBonus
    }
  };
}

export const TRUST_MAX = { verification: 35, freshness: 30, reports: 25, age: 10 };
const DAY = 86400000;
const FRESH_DAYS = 14;

/**
 * Computes a caretaker's aggregate trust score and factor breakdown.
 *
 * @param {object} params
 * @param {boolean} params.verified
 * @param {Array} [params.rooms=[]]
 * @param {number} [params.reportCount=0]
 * @param {string|Date} [params.joinedAt]
 * @param {number|Date} [params.now=Date.now()]
 * @returns {{ score: number, items: Array, breakdown: Array }}
 */
export function computeTrust({ verified, rooms = [], reportCount = 0, joinedAt, now = Date.now() }) {
  const vacant = rooms.filter((r) => r.status === 'Vacant');
  const fresh = vacant.filter((r) => (now - new Date(r.lastConfirmedVacantAt).getTime()) / DAY < FRESH_DAYS).length;
  const freshness = vacant.length === 0 ? TRUST_MAX.freshness / 2 : Math.round((TRUST_MAX.freshness * fresh) / vacant.length);
  const reports = Math.max(0, TRUST_MAX.reports - 8 * reportCount);
  const joinedDate = joinedAt ? new Date(joinedAt).getTime() : now;
  const months = Math.max(0, Math.floor((now - joinedDate) / (30 * DAY)));
  const age = Math.min(TRUST_MAX.age, months);
  const items = [
    {
      key: 'verification',
      label: 'Verification',
      points: verified ? TRUST_MAX.verification : 0,
      max: TRUST_MAX.verification,
      note: verified ? 'ID checked by our team' : 'Not verified yet'
    },
    {
      key: 'freshness',
      label: 'Listing freshness',
      points: freshness,
      max: TRUST_MAX.freshness,
      note: vacant.length === 0 ? 'No vacant listings to check yet' : `${fresh} of ${vacant.length} vacant rooms confirmed in the last ${FRESH_DAYS} days`
    },
    {
      key: 'reports',
      label: 'Reports',
      points: reports,
      max: TRUST_MAX.reports,
      note: reportCount === 0 ? 'No reports on your listings' : `${reportCount} report${reportCount === 1 ? '' : 's'} on your listings`
    },
    {
      key: 'age',
      label: 'Account age',
      points: age,
      max: TRUST_MAX.age,
      note: months < 1 ? 'Joined this month' : `${months} month${months === 1 ? '' : 's'} on Rommie`
    }
  ];
  const score = Math.max(0, Math.min(100, items.reduce((sum, i) => sum + i.points, 0)));
  return {
    score,
    items,
    breakdown: items
  };
}

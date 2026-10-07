/**
 * chargeableTotal / money mapping / reviews mapping selftest (no network).
 * Imports the real TypeScript modules (Node >= 22.18).
 * Run: node scripts/payments-money-selftest.mjs
 */
import assert from 'node:assert/strict';

const ct = await import('../src/utils/chargeableTotal.ts');
const att = await import('../src/utils/workRequestAttachments.ts');
const rv = await import('../src/utils/reviewsMapping.ts');
const neg = await import('../src/utils/workRequestNegotiation.ts');

// ── chargeableTotal is the payable amount (never packagePrice) ──────────────
assert.equal(
  ct.chargeableAmount({ packagePrice: '1000.00', chargeableTotal: '1250.00' }),
  1250,
);
assert.equal(ct.chargeableAmount({ chargeableTotal: '900.5' }), 900.5);
assert.equal(ct.chargeableAmount({ chargeableTotal: 300 }), 300);
// Missing / zero / garbage total → not payable, NOT a fallback to packagePrice.
assert.equal(ct.chargeableAmount({ packagePrice: '1000.00' }), null);
assert.equal(ct.chargeableAmount({ packagePrice: '1000.00', chargeableTotal: '0.00' }), null);
assert.equal(ct.chargeableAmount({ chargeableTotal: 'abc' }), null);
assert.equal(ct.chargeableAmount({ chargeableTotal: '' }), null);
assert.equal(ct.chargeableAmount(null), null);
assert.equal(ct.chargeableAmount(undefined), null);
// No float drift: "SAR 900.00" style amounts are never mis-parsed as 90000.
assert.equal(ct.chargeableAmount({ chargeableTotal: '900.00' }), 900);

// ── add-on lines ────────────────────────────────────────────────────────────
assert.deepEqual(
  ct.addonLines([
    { id: 'a1', title: 'Rush', money: { amount: 100, currency: 'SAR' } },
    { id: 'a2', title: 'Extra', price: 'SAR 150.00' },
    { title: 'Legacy', price: 40 },
    'junk',
  ]),
  [
    { id: 'a1', title: 'Rush', amount: 100 },
    { id: 'a2', title: 'Extra', amount: 150 },
    { id: 'addon-2', title: 'Legacy', amount: 40 },
    { id: 'addon-3', title: 'Add-on', amount: 0 },
  ],
);
assert.deepEqual(ct.addonLines(null), []);

// ── attachment validation mirrors the backend work_request purpose ──────────
const file = (mimeType, byteSize, fileName = 'f') => ({ mimeType, byteSize, fileName });
assert.equal(att.validateWorkRequestAttachment(file('application/pdf', 1024)), null);
assert.equal(att.validateWorkRequestAttachment(file('image/png', 1024)), null);
assert.equal(att.validateWorkRequestAttachment(file('image/jpeg', 1024)), null);
assert.notEqual(att.validateWorkRequestAttachment(file('image/webp', 1024)), null);
assert.notEqual(att.validateWorkRequestAttachment(file('application/zip', 1024)), null);
assert.notEqual(att.validateWorkRequestAttachment(file('application/pdf', 0)), null);
assert.notEqual(
  att.validateWorkRequestAttachment(file('application/pdf', 20 * 1024 * 1024 + 1)),
  null,
);
assert.equal(att.validateWorkRequestAttachment(file('application/pdf', 20 * 1024 * 1024)), null);
assert.equal(att.attachmentIcon('application/pdf'), 'document-text-outline');
assert.equal(att.attachmentIcon('image/png'), 'image-outline');
assert.equal(att.attachmentIcon('brief.pdf'), 'document-text-outline');

// ── reviews mapping: list/total/average line up ─────────────────────────────
const now = new Date('2026-10-06T12:00:00Z');
const review = (id, rating, createdAt) => ({
  id,
  engagementId: `e-${id}`,
  engagementTitle: `Job ${id}`,
  rating,
  body: `body ${id}`,
  createdAt,
  reviewer: {
    id: `u-${id}`,
    displayName: `User ${id}`,
    username: `u${id}`,
    isVerified: false,
    avatarUrl: null,
    title: null,
  },
});
const items = [
  review('1', 5, '2026-10-06T11:30:00Z'),
  review('2', 4, '2026-10-04T12:00:00Z'),
  review('3', 5, '2026-01-02T12:00:00Z'),
];
const bundle = rv.buildReviewsBundleFromApi(items, 3, { rating: 0, reviewCount: 0 }, now);
assert.equal(bundle.total, 3);
assert.equal(bundle.reviews.length, 3);
assert.equal(bundle.average, 4.7);
assert.equal(bundle.reviews[0].timeAgo, '30m ago');
assert.equal(bundle.reviews[1].timeAgo, '2d ago');
assert.equal(bundle.reviews[0].serviceName, 'Job 1');
assert.equal(bundle.reviews[0].authorAvatar, '');
const five = bundle.distribution.find((d) => d.stars === 5);
assert.ok(Math.abs(five.percent - 2 / 3) < 1e-9);
assert.equal(bundle.distribution.find((d) => d.stars === 1).percent, 0);

// Partial list: total from the server, average from the profile aggregate.
const partial = rv.buildReviewsBundleFromApi(items.slice(0, 1), 40, { rating: 4.5, reviewCount: 40 }, now);
assert.equal(partial.total, 40);
assert.equal(partial.average, 4.5);

// Empty.
const empty = rv.buildReviewsBundleFromApi([], 0, { rating: 0, reviewCount: 0 }, now);
assert.equal(empty.total, 0);
assert.equal(empty.average, 0);
assert.equal(empty.reviews.length, 0);

// ── job-posting negotiation: owner SELECTS, selected applicant ACCEPTS ──────
const jobReq = (status) => ({
  status,
  source: 'job_posting',
  senderUserId: 'applicant',
  recipientUserId: 'owner',
});
// Owner can never "accept" a job application directly.
assert.deepEqual(neg.getNegotiationTurn(jobReq('pending'), 'owner').actions, [
  'request_changes',
  'reject_request',
]);
// Applicant: no accept until selected…
assert.deepEqual(neg.getNegotiationTurn(jobReq('pending'), 'applicant').actions, []);
assert.equal(
  neg.getNegotiationTurn(jobReq('pending'), 'applicant').waitingMessage,
  'Waiting for the listing owner to select you.',
);
// …then Accept.
assert.deepEqual(
  neg.getNegotiationTurn(jobReq('pending'), 'applicant', { applicantSelected: true }).actions,
  ['accept'],
);
assert.deepEqual(
  neg.getNegotiationTurn(jobReq('changes_declined'), 'applicant', { applicantSelected: true }).actions,
  ['accept_original_terms'],
);
// Accept Changes needs selection too.
assert.deepEqual(neg.getNegotiationTurn(jobReq('changes_requested'), 'applicant').actions, [
  'decline_changes',
]);
assert.deepEqual(
  neg.getNegotiationTurn(jobReq('changes_requested'), 'applicant', { applicantSelected: true }).actions,
  ['accept_changes', 'decline_changes'],
);
// Service / direct requests are unchanged: the recipient accepts.
const svc = { status: 'pending', source: 'service_request', senderUserId: 's', recipientUserId: 'r' };
assert.deepEqual(neg.getNegotiationTurn(svc, 'r').actions, ['accept', 'request_changes', 'reject_request']);

console.log('payments-money-selftest: OK');

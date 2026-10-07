/**
 * The backend currently runs a MOCK payment provider (no real charge). While
 * this is true the payment screens say so honestly and, in dev builds, list
 * the test card numbers. Flip to false when a real provider ships.
 */
export const PAYMENTS_MOCK_MODE = true;

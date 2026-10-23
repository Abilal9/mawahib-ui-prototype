import { apiRequest } from '../lib/apiClient';

/** Frozen Phase B read. Dates are Gregorian YYYY-MM-DD. The body is validated by parseCalendarPage. */
export function getMyCalendar(from: string, to: string): Promise<unknown> {
  const query = new URLSearchParams({ from, to });
  return apiRequest<unknown>(`/users/me/calendar?${query.toString()}`);
}

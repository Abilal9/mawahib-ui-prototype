/** Local calendar-day helpers. Comparisons ignore the clock so today stays selectable. */

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfLocalMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isPastLocalDay(day: Date, now: Date = new Date()): boolean {
  return startOfLocalDay(day).getTime() < startOfLocalDay(now).getTime();
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

export function isCurrentLocalMonth(month: Date, now: Date = new Date()): boolean {
  return (
    month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth()
  );
}

/** True when `month` is strictly before the month that contains `now`. */
export function isBeforeCurrentMonth(month: Date, now: Date = new Date()): boolean {
  const current = startOfLocalMonth(now);
  const candidate = startOfLocalMonth(month);
  return candidate.getTime() < current.getTime();
}

/**
 * A day cannot be chosen when it is before today, or before a range start
 * that is already chosen. `notBefore` is date-only; the start day itself stays enabled.
 */
export function isCalendarDayBlocked(
  day: Date,
  now: Date = new Date(),
  notBefore?: Date | null,
): boolean {
  if (isPastLocalDay(day, now)) return true;
  if (!notBefore) return false;
  return startOfLocalDay(day).getTime() < startOfLocalDay(notBefore).getTime();
}

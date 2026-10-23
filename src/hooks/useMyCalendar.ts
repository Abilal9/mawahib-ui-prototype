import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getMyCalendar } from '../services/calendarApi';
import {
  advanceVisibleMonth,
  monthBounds,
  parseCalendarPage,
  parseCivilDate,
  shouldApplyCalendarResult,
  todayCivilDate,
  type CalendarPage,
  type CalendarTicket,
} from '../utils/gregorianCivilDate';

export type CalendarPhase = 'loading' | 'ready' | 'error';

/**
 * One visible Gregorian month. An older response cannot replace the month
 * now on screen. Focus and pull-to-refresh skip the in-memory cache.
 */
export function useMyCalendar() {
  const initialToday = todayCivilDate();
  const initialParts = parseCivilDate(initialToday);
  const [year, setYear] = useState(initialParts?.year ?? 1970);
  const [month, setMonth] = useState(initialParts?.month ?? 1);
  const [selected, setSelected] = useState(initialToday);
  const [today, setToday] = useState(initialToday);
  const [page, setPage] = useState<CalendarPage | null>(null);
  const [phase, setPhase] = useState<CalendarPhase>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const generation = useRef(0);
  const cache = useRef(new Map<string, CalendarPage>());
  const visible = useRef({ from: '', to: '' });
  const seenWindow = useRef<string | null>(null);
  const mounted = useRef(true);
  const cursor = useRef({ year, month, selected, today });
  useEffect(() => {
    cursor.current = { year, month, selected, today };
  }, [year, month, selected, today]);

  const load = useCallback(async (from: string, to: string, bypassCache: boolean) => {
    visible.current = { from, to };
    const key = `${from}|${to}`;
    if (!bypassCache) {
      const cached = cache.current.get(key);
      if (cached) {
        generation.current += 1;
        setRefreshing(false);
        setPage(cached);
        setPhase('ready');
        return;
      }
      setRefreshing(false);
      setPage(null);
      setPhase('loading');
    }
    const gen = generation.current + 1;
    generation.current = gen;
    const ticket: CalendarTicket = { generation: gen, from, to };
    try {
      const raw = await getMyCalendar(from, to);
      const current: CalendarTicket = {
        generation: generation.current,
        from: visible.current.from,
        to: visible.current.to,
      };
      if (!mounted.current || !shouldApplyCalendarResult(current, ticket)) return;
      const parsed = parseCalendarPage(raw, from, to);
      if (!parsed) {
        throw new Error('Calendar response did not match the requested month');
      }
      cache.current.set(key, parsed);
      setPage(parsed);
      setPhase('ready');
    } catch {
      const current: CalendarTicket = {
        generation: generation.current,
        from: visible.current.from,
        to: visible.current.to,
      };
      if (!mounted.current || !shouldApplyCalendarResult(current, ticket)) return;
      cache.current.delete(key);
      setPage(null);
      setPhase('error');
    } finally {
      const current: CalendarTicket = {
        generation: generation.current,
        from: visible.current.from,
        to: visible.current.to,
      };
      if (mounted.current && shouldApplyCalendarResult(current, ticket)) {
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      setToday(todayCivilDate());
      const bounds = monthBounds(year, month);
      const key = `${bounds.from}|${bounds.to}`;
      const bypass = seenWindow.current === key;
      seenWindow.current = key;
      void load(bounds.from, bounds.to, bypass);
      return () => {
        mounted.current = false;
      };
    }, [year, month, load]),
  );

  const shiftMonth = useCallback((delta: number) => {
    const next = advanceVisibleMonth(cursor.current, delta);
    cursor.current = { ...cursor.current, ...next };
    setYear(next.year);
    setMonth(next.month);
    setSelected(next.selected);
  }, []);

  const selectDay = useCallback((iso: string) => {
    const parts = parseCivilDate(iso);
    const current = cursor.current;
    if (!parts || parts.year !== current.year || parts.month !== current.month) return;
    cursor.current = { ...current, selected: iso };
    setSelected(iso);
  }, []);

  const retry = useCallback(() => {
    const bounds = monthBounds(year, month);
    setPhase('loading');
    setPage(null);
    void load(bounds.from, bounds.to, true);
  }, [year, month, load]);

  const refresh = useCallback(() => {
    const bounds = monthBounds(year, month);
    setRefreshing(true);
    void load(bounds.from, bounds.to, true);
  }, [year, month, load]);

  return {
    year,
    month,
    selected,
    today,
    page,
    phase,
    refreshing,
    shiftMonth,
    selectDay,
    retry,
    refresh,
  };
}

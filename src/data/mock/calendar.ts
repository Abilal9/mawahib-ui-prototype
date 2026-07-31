import { colors } from '../../theme';

export interface CalendarEvent {
  id: string;
  title: string;
  year: number;
  month: number; // 0-indexed, matches Date#getMonth()
  day: number;
  time: string;
  color: string;
}

export const CALENDAR_MONTH = new Date(2026, 6, 1);

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Client Meeting - Brand Review',
    year: 2026,
    month: 6,
    day: 14,
    time: '10:00 AM',
    color: colors.primary,
  },
  {
    id: 'e1b',
    title: 'Portfolio Feedback Call',
    year: 2026,
    month: 6,
    day: 14,
    time: '1:30 PM',
    color: '#3B82F6',
  },
  {
    id: 'e1c',
    title: 'Send revised moodboard',
    year: 2026,
    month: 6,
    day: 14,
    time: '4:00 PM',
    color: '#F0B429',
  },
  {
    id: 'e2',
    title: 'Photo Shoot - Emirates',
    year: 2026,
    month: 6,
    day: 16,
    time: '2:00 PM',
    color: '#2CB67D',
  },
  {
    id: 'e2b',
    title: 'Location scout walkthrough',
    year: 2026,
    month: 6,
    day: 16,
    time: '5:30 PM',
    color: colors.primary,
  },
  {
    id: 'e3',
    title: 'Design Workshop',
    year: 2026,
    month: 6,
    day: 22,
    time: '11:00 AM',
    color: '#FF6B35',
  },
  {
    id: 'e3b',
    title: 'Team standup',
    year: 2026,
    month: 6,
    day: 22,
    time: '9:00 AM',
    color: '#3B82F6',
  },
  {
    id: 'e4',
    title: 'UX interview - candidate panel',
    year: 2026,
    month: 6,
    day: 8,
    time: '11:00 AM',
    color: '#2CB67D',
  },
  {
    id: 'e5',
    title: 'App store asset delivery',
    year: 2026,
    month: 6,
    day: 28,
    time: '3:00 PM',
    color: colors.primary,
  },
  {
    id: 'e5b',
    title: 'Launch checklist review',
    year: 2026,
    month: 6,
    day: 28,
    time: '5:00 PM',
    color: '#F0B429',
  },
];

export const getUpcomingEvents = (limit = 2) =>
  [...calendarEvents]
    .sort((a, b) => {
      const aKey = a.year * 10000 + a.month * 100 + a.day;
      const bKey = b.year * 10000 + b.month * 100 + b.day;
      return aKey - bKey;
    })
    .slice(0, limit);

export const getEventsForDay = (year: number, month: number, day: number) =>
  calendarEvents
    .filter(
      (event) => event.year === year && event.month === month && event.day === day
    )
    .sort((a, b) => a.time.localeCompare(b.time));

export const getEventDaysInMonth = (year: number, month: number) =>
  [
    ...new Set(
      calendarEvents
        .filter((event) => event.year === year && event.month === month)
        .map((event) => event.day)
    ),
  ];

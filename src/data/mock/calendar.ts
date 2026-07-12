import { colors } from '../../theme';

export interface CalendarEvent {
  id: string;
  title: string;
  date: number;
  time: string;
  color: string;
}

export const CALENDAR_MONTH = new Date(2026, 6, 1);

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Client Meeting - Brand Review',
    date: 14,
    time: '10:00 AM',
    color: colors.primary,
  },
  {
    id: 'e2',
    title: 'Photo Shoot - Emirates',
    date: 16,
    time: '2:00 PM',
    color: '#2CB67D',
  },
  {
    id: 'e3',
    title: 'Design Workshop',
    date: 22,
    time: '11:00 AM',
    color: '#FF6B35',
  },
];

export const getUpcomingEvents = (limit = 2) =>
  [...calendarEvents].sort((a, b) => a.date - b.date).slice(0, limit);

export const getEventsForDay = (day: number) =>
  calendarEvents.filter((event) => event.date === day);

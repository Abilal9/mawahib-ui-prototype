export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Freelance',
  'Contract',
  'Internship',
  'Self-employed',
  'Temporary',
  'Other',
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const LOCATION_TYPES = ['On-site', 'Hybrid', 'Remote'] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export const MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const MONTH_SHORT = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function yearOptions(spanBack = 70, spanForward = 6): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + spanForward; y >= current - spanBack; y -= 1) {
    years.push(y);
  }
  return years;
}

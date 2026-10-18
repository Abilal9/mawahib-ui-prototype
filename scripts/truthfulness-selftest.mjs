import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildServicePackages,
  displayCategory,
  displayPrice,
  postedJobCreate,
  requiredTitle,
  serviceDetailRoute,
} from '../src/domain/truthfulFacts.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

assert.equal(displayCategory(null), null);
assert.equal(displayCategory('   '), null);
assert.equal(displayCategory(' Photography '), 'Photography');

assert.equal(displayPrice(null), null);
assert.equal(displayPrice(undefined), null);
assert.equal(displayPrice(Number.NaN), null);
assert.equal(displayPrice(0), 0);
assert.equal(displayPrice(25), 25);

assert.deepEqual(serviceDetailRoute('svc-1', 'provider-1', 'me'), {
  serviceId: 'svc-1',
  userId: 'provider-1',
});
assert.deepEqual(serviceDetailRoute('svc-1', 'me', 'me'), { serviceId: 'svc-1' });

assert.throws(() => postedJobCreate({ title: '   ', location: 'Riyadh' }), /job title/);
assert.throws(() => postedJobCreate({ title: 'Designer', location: '   ' }), /job location/);
assert.throws(() => postedJobCreate({ title: 'Designer' }), /job location/);
assert.deepEqual(
  postedJobCreate({ title: ' Designer ', location: ' Remote ', description: '   ' }),
  { title: 'Designer', location: 'Remote', description: '' },
);
assert.equal(
  postedJobCreate({
    title: 'Designer',
    location: 'Riyadh',
    description: ' Need a poster ',
  }).description,
  'Need a poster',
);

assert.throws(() => requiredTitle('   ', 'project title'), /project title/);
assert.equal(requiredTitle('  Brand film  ', 'service name'), 'Brand film');

const parsePositive = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};
assert.throws(() =>
  buildServicePackages(
    [{ name: 'Basic', price: '', delivery: '5 days', features: ['Logo'], required: true }],
    parsePositive,
  ),
);
assert.throws(() =>
  buildServicePackages(
    [{ name: 'Basic', price: '100', delivery: '   ', features: ['Logo'], required: true }],
    parsePositive,
  ),
);
assert.throws(() =>
  buildServicePackages(
    [{ name: 'Basic', price: '100', delivery: '5 days', features: [], required: true }],
    parsePositive,
  ),
);
assert.throws(() =>
  buildServicePackages(
    [
      {
        name: 'Basic',
        price: '100',
        delivery: '5 days',
        features: ['Logo'],
        required: true,
      },
      { name: 'Standard', price: '0', delivery: '', features: [], required: false },
    ],
    parsePositive,
  ),
);
const parseNonNegative = (value) => {
  if (!String(value).trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};
assert.deepEqual(
  buildServicePackages(
    [
      {
        name: 'Basic',
        price: '0',
        delivery: '5 days',
        features: ['Logo'],
        required: true,
      },
    ],
    parseNonNegative,
  ),
  [{ name: 'Basic', price: 0, deliveryLabel: '5 days', includes: ['Logo'] }],
);
assert.throws(() =>
  buildServicePackages(
    [
      {
        name: 'Basic',
        price: '100',
        delivery: '5 days',
        features: ['Logo'],
        required: true,
      },
      { name: 'Standard', price: '0', delivery: '', features: [], required: false },
    ],
    parseNonNegative,
  ),
);
assert.deepEqual(
  buildServicePackages(
    [
      {
        name: 'Basic',
        price: '100',
        delivery: ' 5 days ',
        features: [' Logo '],
        required: true,
      },
      { name: 'Standard', price: '', delivery: '', features: [], required: false },
    ],
    parsePositive,
  ),
  [{ name: 'Basic', price: 100, deliveryLabel: '5 days', includes: ['Logo'] }],
);

const home = read('src/screens/home/HomeScreen.tsx');
const talentMapper = read('src/services/exploreApi.ts');
const jobs = read('src/context/UserJobsContext.tsx');
const postJob = read('src/screens/jobs/PostJobScreen.tsx');
const addService = read('src/screens/profile/AddProfileServiceScreen.tsx');
const addProject = read('src/screens/profile/AddPortfolioProjectScreen.tsx');
const calendar = read('src/screens/profile/CalendarScreen.tsx');
const sidebar = read('src/components/layout/SidebarCalendarPreview.tsx');

assert.equal(home.includes("?? 'Riyadh'"), false);
assert.equal(home.includes('Available'), false);
assert.equal(home.includes('hourlyRate'), false);
assert.equal(home.includes('serviceDetailRoute'), true);
assert.equal(talentMapper.includes("|| 'General'"), false);
assert.equal(talentMapper.includes("'Available'"), false);
assert.equal(talentMapper.includes('rateLabel:'), false);
assert.equal(jobs.includes('Untitled job'), false);
assert.equal(jobs.includes('Job posted from Mawahib'), false);
assert.equal(jobs.includes("exploreTag: 'Design'"), false);
assert.equal(jobs.includes("|| 'Remote'"), false);
assert.equal(jobs.includes('me.location'), false);
assert.equal(postJob.includes('!location.trim()'), true);
assert.equal(postJob.includes('!trimmedTitle'), true);
assert.equal(addService.includes('Untitled service'), false);
assert.equal(addService.includes("'Flexible'"), false);
assert.equal(addService.includes('Details TBD'), false);
assert.equal(addProject.includes('Untitled project'), false);
assert.equal(calendar.includes('data/mock/calendar'), false);
assert.equal(calendar.includes('getEventsForDay'), false);
assert.equal(sidebar.includes('EVENT_DOTS'), false);
assert.equal(read('src/constants/profile.ts').includes('Creative Professional'), true);

console.log('truthfulness-selftest ok');

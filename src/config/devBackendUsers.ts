/**
 * Known development Nest users (from `npm run seed:dev`).
 * Used only so Explore can deep-link to real visitor profiles until a
 * directory/search API exists. Not mock identity — these are backend UUIDs.
 */
export const DEV_BACKEND_USERS = {
  layla: {
    id: '37565274-b475-4db2-b137-5a42a7cfbc95',
    email: 'layla.talent@mawahib.dev',
    name: 'Layla AlHarbi',
    username: 'layla_talent_dev',
    title: 'Brand & Visual Designer',
    location: 'Riyadh, Saudi Arabia',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
  najd: {
    id: '7fabcc67-1f01-4cf8-a946-58c9d35289a0',
    email: 'najd.studio@mawahib.dev',
    name: 'Najd Creative Studio',
    username: 'najd_studio_dev',
    title: 'Creative Production Studio',
    location: 'Dubai, United Arab Emirates',
    avatar:
      'https://images.unsplash.com/photo-1560179707-f14ee9aa457c?w=200&h=200&fit=crop',
  },
} as const;

export interface ReviewItem {
  id: string;
  authorName: string;
  authorAvatar: string;
  timeAgo: string;
  rating: number;
  serviceName: string;
  body: string;
  image?: string;
}

export interface ReviewDistribution {
  stars: 1 | 2 | 3 | 4 | 5;
  percent: number;
}

export interface ReviewsBundle {
  average: number;
  total: number;
  distribution: ReviewDistribution[];
  reviews: ReviewItem[];
}

const LOREM =
  'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.';

const AVATARS = {
  courtney:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
  jacob: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
  floyd: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
  jane: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop',
  ronald: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop',
};

const ATTACHMENT =
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop';

const defaultReviews: ReviewItem[] = [
  {
    id: 'rv1',
    authorName: 'Courtney Henry',
    authorAvatar: AVATARS.courtney,
    timeAgo: '2 mins ago',
    rating: 4,
    serviceName: 'Designing Dashboards',
    body: LOREM,
    image: ATTACHMENT,
  },
  {
    id: 'rv2',
    authorName: 'Jacob Jones',
    authorAvatar: AVATARS.jacob,
    timeAgo: '2 mins ago',
    rating: 4,
    serviceName: 'Designing Dashboards',
    body: LOREM,
  },
  {
    id: 'rv3',
    authorName: 'Floyd Miles',
    authorAvatar: AVATARS.floyd,
    timeAgo: '3 days ago',
    rating: 4,
    serviceName: 'Designing Dashboards',
    body: LOREM,
  },
  {
    id: 'rv4',
    authorName: 'Jane Cooper',
    authorAvatar: AVATARS.jane,
    timeAgo: '3 days ago',
    rating: 5,
    serviceName: 'Event Photography',
    body: LOREM,
  },
  {
    id: 'rv5',
    authorName: 'Ronald Richards',
    authorAvatar: AVATARS.ronald,
    timeAgo: '1 week ago',
    rating: 3,
    serviceName: 'Brand Identity Pack',
    body: LOREM,
  },
];

const defaultBundle: ReviewsBundle = {
  average: 4.0,
  total: 72,
  distribution: [
    { stars: 5, percent: 0.92 },
    { stars: 4, percent: 0.68 },
    { stars: 3, percent: 0.34 },
    { stars: 2, percent: 0.16 },
    { stars: 1, percent: 0.04 },
  ],
  reviews: defaultReviews,
};

/** Reviews for own profile (Olivia) and fallback for others */
export const reviewsByUserId: Record<string, ReviewsBundle> = {
  u1: defaultBundle,
};

export function getReviewsForUser(userId?: string): ReviewsBundle {
  if (userId && reviewsByUserId[userId]) {
    return reviewsByUserId[userId];
  }
  // Visitor profiles share the filled demo set for prototype
  return defaultBundle;
}

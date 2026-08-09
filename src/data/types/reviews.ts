export interface ReviewItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timeAgo: string;
  rating: number;
  serviceName: string;
  body: string;
  image?: string;
}

/** Canonical review entity alias */
export type Review = ReviewItem;

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

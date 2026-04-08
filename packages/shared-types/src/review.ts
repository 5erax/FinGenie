export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  userId: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithUser extends Review {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface CreateReviewDto {
  rating: number;
  content: string;
}

export interface UpdateReviewDto {
  rating?: number;
  content?: string;
}

export interface FeaturedReviewsResponse {
  data: ReviewWithUser[];
  total: number;
}

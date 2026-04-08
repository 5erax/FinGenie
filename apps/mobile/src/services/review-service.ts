import { api } from "@/lib/api";
import type {
  Review,
  ReviewWithUser,
  CreateReviewDto,
  UpdateReviewDto,
  FeaturedReviewsResponse,
} from "@fingenie/shared-types";

export type { Review, ReviewWithUser, CreateReviewDto, UpdateReviewDto };

export const reviewService = {
  /** Get the current user's own review (or null) */
  async getMine(): Promise<ReviewWithUser | null> {
    const response = await api.get<ReviewWithUser | null>("/reviews/mine");
    return response.data;
  },

  /** Submit a new review */
  async create(dto: CreateReviewDto): Promise<ReviewWithUser> {
    const response = await api.post<ReviewWithUser>("/reviews", dto);
    return response.data;
  },

  /** Update the current user's review */
  async update(dto: UpdateReviewDto): Promise<ReviewWithUser> {
    const response = await api.put<ReviewWithUser>("/reviews", dto);
    return response.data;
  },

  /** Delete the current user's review */
  async remove(): Promise<void> {
    await api.delete("/reviews");
  },

  /** Get featured reviews (public, no auth needed) */
  async getFeatured(): Promise<FeaturedReviewsResponse> {
    const response =
      await api.get<FeaturedReviewsResponse>("/reviews/featured");
    return response.data;
  },
};

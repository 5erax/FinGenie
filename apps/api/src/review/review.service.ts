import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateReviewDto } from "./dto/create-review.dto";
import type { UpdateReviewDto } from "./dto/update-review.dto";

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new review for the current user.
   * Each user can only submit one review (@@unique([userId])).
   */
  async create(userId: string, dto: CreateReviewDto) {
    // Check if user already has a review
    const existing = await this.prisma.review.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException(
        "Bạn đã đánh giá rồi. Hãy cập nhật đánh giá hiện tại.",
      );
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        rating: dto.rating,
        content: dto.content,
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    this.logger.log(`User ${userId} created review ${review.id}`);
    return review;
  }

  /**
   * Get the current user's own review (or null if they haven't reviewed).
   */
  async findMine(userId: string) {
    return this.prisma.review.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Update the current user's review.
   * Status resets to 'pending' when content changes (needs re-approval).
   */
  async update(userId: string, dto: UpdateReviewDto) {
    const existing = await this.prisma.review.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException("Bạn chưa có đánh giá nào.");
    }

    const review = await this.prisma.review.update({
      where: { userId },
      data: {
        ...dto,
        // Reset to pending when content or rating changes — needs re-approval
        status: "pending",
        isFeatured: false,
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    this.logger.log(`User ${userId} updated review ${review.id}`);
    return review;
  }

  /**
   * Delete the current user's review.
   */
  async remove(userId: string) {
    const existing = await this.prisma.review.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException("Bạn chưa có đánh giá nào.");
    }

    await this.prisma.review.delete({ where: { userId } });
    this.logger.log(`User ${userId} deleted review ${existing.id}`);
  }

  /**
   * Get all approved & featured reviews (public, for landing page).
   */
  async findFeatured() {
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          status: "approved",
          isFeatured: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.review.count({
        where: { status: "approved", isFeatured: true },
      }),
    ]);

    return { data, total };
  }
}

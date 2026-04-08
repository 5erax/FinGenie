import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { ReviewService } from "./review.service";
import { CreateReviewDto, UpdateReviewDto } from "./dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Reviews")
@Controller("reviews")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ─── Public Endpoints ──────────────────────────────────────────────────

  @Get("featured")
  @Public()
  @ApiOperation({ summary: "Get featured reviews (public, for landing page)" })
  @ApiOkResponse({ description: "List of featured reviews with user info" })
  async getFeatured() {
    return this.reviewService.findFeatured();
  }

  // ─── Authenticated Endpoints ───────────────────────────────────────────

  @Get("mine")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current user's review" })
  @ApiOkResponse({ description: "User's review or null" })
  async getMine(@CurrentUser() user: User) {
    return this.reviewService.findMine(user.id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit a review (one per user)" })
  @ApiCreatedResponse({ description: "Review created successfully" })
  @ApiConflictResponse({ description: "User already has a review" })
  async create(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(user.id, dto);
  }

  @Put()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update the current user's review" })
  @ApiOkResponse({ description: "Review updated (status reset to pending)" })
  @ApiNotFoundResponse({ description: "No review found for this user" })
  async update(@CurrentUser() user: User, @Body() dto: UpdateReviewDto) {
    return this.reviewService.update(user.id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete the current user's review" })
  @ApiNoContentResponse({ description: "Review deleted" })
  @ApiNotFoundResponse({ description: "No review found for this user" })
  async remove(@CurrentUser() user: User) {
    return this.reviewService.remove(user.id);
  }
}

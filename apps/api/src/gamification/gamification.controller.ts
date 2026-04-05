import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { GamificationService } from "./gamification.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Gamification")
@ApiBearerAuth()
@Controller("gamification")
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ─── Pet ─────────────────────────────────────────────────────────────────────

  @Get("pet")
  @ApiOperation({ summary: "Get or create the current user's pet" })
  @ApiOkResponse({ description: "Pet record with inventory items" })
  async getPet(@CurrentUser() user: User) {
    return this.gamificationService.getOrCreatePet(user.id);
  }

  @Post("pet/feed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Feed the pet (+20 hunger, +10 XP, recalculates mood)",
  })
  @ApiOkResponse({ description: "Updated pet record" })
  async feedPet(@CurrentUser() user: User) {
    return this.gamificationService.feedPet(user.id);
  }

  @Post("pet/play")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Play with the pet (+20 happiness, +10 XP, recalculates mood)",
  })
  @ApiOkResponse({ description: "Updated pet record" })
  async playWithPet(@CurrentUser() user: User) {
    return this.gamificationService.playWithPet(user.id);
  }

  // ─── Daily Tasks ─────────────────────────────────────────────────────────────

  @Get("tasks")
  @ApiOperation({
    summary: "Get today's daily tasks",
    description:
      "Returns the current user's tasks for today. A fresh set of tasks (3 random + 1 login task) is auto-generated on the first call of the day.",
  })
  @ApiOkResponse({ description: "List of today's daily tasks" })
  async getDailyTasks(@CurrentUser() user: User) {
    return this.gamificationService.getDailyTasks(user.id);
  }

  @Post("tasks/:id/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Mark a daily task as completed and award XP / coins",
  })
  @ApiParam({ name: "id", description: "Daily task ID" })
  @ApiOkResponse({ description: "Updated task record with status = completed" })
  @ApiNotFoundResponse({ description: "Task not found" })
  @ApiBadRequestResponse({
    description: "Task already completed or has expired",
  })
  async completeTask(@CurrentUser() user: User, @Param("id") id: string) {
    return this.gamificationService.completeTask(user.id, id);
  }

  // ─── Streak ──────────────────────────────────────────────────────────────────

  @Get("streak")
  @ApiOperation({ summary: "Get the current user's streak and coin balance" })
  @ApiOkResponse({ description: "UserStreak record" })
  async getStreak(@CurrentUser() user: User) {
    return this.gamificationService.getStreak(user.id);
  }

  @Post("check-in")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Daily check-in",
    description:
      "Updates the login streak and awards coins (5 + streak × 2). Idempotent — calling more than once per day returns `alreadyCheckedIn: true`.",
  })
  @ApiOkResponse({
    description: "Check-in result: { alreadyCheckedIn, streak, coinsAwarded }",
  })
  async checkIn(@CurrentUser() user: User) {
    return this.gamificationService.checkIn(user.id);
  }

  // ─── Achievements ─────────────────────────────────────────────────────────────

  @Get("achievements")
  @ApiOperation({
    summary: "Get all achievements with unlock status for the current user",
    description:
      "Returns every Achievement record enriched with `unlocked: boolean` and `unlockedAt: Date | null`.",
  })
  @ApiOkResponse({ description: "Achievement list with unlock flags" })
  async getAchievements(@CurrentUser() user: User) {
    return this.gamificationService.getAchievements(user.id);
  }
}

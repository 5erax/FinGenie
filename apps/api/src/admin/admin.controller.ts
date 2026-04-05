import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { AdminService } from "./admin.service";

@ApiTags("Admin")
@ApiBearerAuth()
@Roles(UserRole.admin)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Transactions ──────────────────────────────────────────

  @Get("transactions")
  @ApiOperation({ summary: "List all transactions (admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "type", required: false, enum: ["income", "expense"] })
  @ApiQuery({ name: "userId", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiOkResponse({ description: "Paginated transaction list" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async listTransactions(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("type") type?: string,
    @Query("userId") userId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.adminService.findAllTransactions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      userId,
      startDate,
      endDate,
    });
  }

  // ── Wallets ───────────────────────────────────────────────

  @Get("wallets")
  @ApiOperation({ summary: "List all wallets (admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "type",
    required: false,
    enum: ["cash", "bank", "e_wallet", "other"],
  })
  @ApiQuery({ name: "userId", required: false })
  @ApiOkResponse({ description: "Paginated wallet list" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async listWallets(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("type") type?: string,
    @Query("userId") userId?: string,
  ) {
    return this.adminService.findAllWallets({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      userId,
    });
  }

  // ── Categories ────────────────────────────────────────────

  @Get("categories")
  @ApiOperation({ summary: "List all categories (admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "isDefault", required: false })
  @ApiOkResponse({ description: "Paginated category list" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async listCategories(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("isDefault") isDefault?: string,
  ) {
    return this.adminService.findAllCategories({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      isDefault,
    });
  }

  @Post("categories")
  @ApiOperation({ summary: "Create a system category (admin)" })
  @ApiOkResponse({ description: "Created category" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async createCategory(
    @Body()
    body: {
      name: string;
      icon: string;
      color: string;
      isDefault?: boolean;
    },
  ) {
    return this.adminService.createCategory(body);
  }

  @Patch("categories/:id")
  @ApiOperation({ summary: "Update a category (admin)" })
  @ApiOkResponse({ description: "Updated category" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async updateCategory(
    @Param("id") id: string,
    @Body() body: { name?: string; icon?: string; color?: string },
  ) {
    return this.adminService.updateCategory(id, body);
  }

  @Delete("categories/:id")
  @ApiOperation({ summary: "Delete a category (admin)" })
  @ApiOkResponse({ description: "Category deleted" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async deleteCategory(@Param("id") id: string) {
    return this.adminService.deleteCategory(id);
  }

  // ── Subscriptions ─────────────────────────────────────────

  @Get("subscriptions")
  @ApiOperation({ summary: "List all subscriptions (admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["active", "cancelled", "expired"],
  })
  @ApiQuery({
    name: "plan",
    required: false,
    enum: ["free", "monthly", "yearly"],
  })
  @ApiOkResponse({ description: "Paginated subscription list" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async listSubscriptions(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("plan") plan?: string,
  ) {
    return this.adminService.findAllSubscriptions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      plan,
    });
  }

  // ── Payments ──────────────────────────────────────────────

  @Get("payments")
  @ApiOperation({ summary: "List all payment orders (admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["pending", "success", "failed", "cancelled"],
  })
  @ApiOkResponse({ description: "Paginated payment list" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async listPayments(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    return this.adminService.findAllPayments({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  // ── Gamification ──────────────────────────────────────────

  @Get("pets")
  @ApiOperation({ summary: "List all pets (admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiOkResponse({ description: "Paginated pet list" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async listPets(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.adminService.findAllPets({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("achievements")
  @ApiOperation({ summary: "List all achievements (admin)" })
  @ApiOkResponse({ description: "Achievement list" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async listAchievements() {
    const achievements = await this.adminService.findAllAchievements();
    // Map _count.users to _count.userAchievements for frontend compatibility
    return achievements.map((a) => ({
      ...a,
      _count: { userAchievements: a._count.users },
    }));
  }

  // ── AI Chat Sessions ──────────────────────────────────────

  @Get("ai-sessions")
  @ApiOperation({ summary: "List all AI chat sessions (admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiOkResponse({ description: "Paginated AI chat session list" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async listAIChatSessions(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.findAllAIChatSessions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // ── Analytics ─────────────────────────────────────────────

  @Get("analytics")
  @ApiOperation({ summary: "Get analytics overview (admin)" })
  @ApiQuery({
    name: "period",
    required: false,
    enum: ["7d", "30d", "90d"],
  })
  @ApiOkResponse({ description: "Analytics data" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async getAnalytics(@Query("period") period?: string) {
    return this.adminService.getAnalytics(period);
  }
}

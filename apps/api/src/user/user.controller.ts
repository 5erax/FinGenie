import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import type { User } from "@prisma/client";
import { UserService } from "./user.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UpdateProfileDto } from "../auth/dto/update-profile.dto";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiOkResponse({ description: "Current user profile" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      premiumUntil: user.premiumUntil,
      createdAt: user.createdAt,
    };
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiOkResponse({ description: "Updated user profile" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.userService.updateProfile(user.id, dto);
    return {
      id: updated.id,
      email: updated.email,
      phone: updated.phone,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      role: updated.role,
      premiumUntil: updated.premiumUntil,
      createdAt: updated.createdAt,
    };
  }

  @Delete("me")
  @ApiOperation({ summary: "Delete own account and all associated data" })
  @ApiOkResponse({ description: "Account deleted" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async deleteOwnAccount(@CurrentUser() user: User) {
    await this.userService.deleteSelf(user.id, user.firebaseUid);
    return { success: true };
  }

  // Admin endpoints
  @Get("admin/stats")
  @Roles(UserRole.admin)
  @ApiOperation({ summary: "Get admin dashboard statistics" })
  @ApiOkResponse({ description: "Dashboard stats" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async getAdminStats() {
    return this.userService.getAdminStats();
  }

  @Get()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: "List all users (admin only)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "role", required: false, enum: UserRole })
  @ApiQuery({ name: "search", required: false })
  @ApiOkResponse({ description: "Paginated user list" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async listUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("role") role?: UserRole,
    @Query("search") search?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const { users, total } = await this.userService.findAll({
      page: p,
      limit: l,
      role,
      search,
    });

    const totalPages = Math.ceil(total / l);

    return {
      data: users,
      total,
      page: p,
      limit: l,
      totalPages,
    };
  }

  @Get(":id")
  @Roles(UserRole.admin)
  @ApiOperation({ summary: "Get user by ID (admin only)" })
  @ApiOkResponse({ description: "User details" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async getUserById(@Param("id") id: string) {
    return this.userService.findByIdFull(id);
  }

  @Patch(":id/role")
  @Roles(UserRole.admin)
  @ApiOperation({ summary: "Update user role (admin only)" })
  @ApiOkResponse({ description: "Updated user" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async updateRole(@Param("id") id: string, @Body("role") role: UserRole) {
    const updated = await this.userService.setRole(id, role);
    return {
      id: updated.id,
      displayName: updated.displayName,
      role: updated.role,
    };
  }

  @Delete(":id")
  @Roles(UserRole.admin)
  @ApiOperation({ summary: "Delete user (admin only)" })
  @ApiOkResponse({ description: "User deleted" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  async deleteUser(@Param("id") id: string) {
    await this.userService.deleteUser(id);
    return { success: true };
  }
}

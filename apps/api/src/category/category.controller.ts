import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories for current user (system defaults + custom)' })
  @ApiOkResponse({ description: 'List of categories' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async findAll(@CurrentUser() user: User) {
    return this.categoryService.findAllForUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom category' })
  @ApiCreatedResponse({ description: 'Category created' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async create(@CurrentUser() user: User, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a custom category' })
  @ApiOkResponse({ description: 'Category updated' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiForbiddenResponse({ description: 'System category or not owned by user' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom category' })
  @ApiNoContentResponse({ description: 'Category deleted' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiForbiddenResponse({ description: 'System category or not owned by user' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.categoryService.remove(user.id, id);
  }
}

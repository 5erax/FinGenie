import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Category } from '@prisma/client';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns system default categories (isDefault=true) merged with
   * the user's own custom categories, ordered by isDefault desc then name asc.
   */
  async findAllForUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [{ isDefault: true }, { userId }],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        isDefault: false,
        userId,
      },
    });

    this.logger.log(`Category created: ${category.id} for user ${userId}`);
    return category;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) throw new NotFoundException('Category not found');
    if (category.isDefault) {
      throw new ForbiddenException('Cannot edit system default categories');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException('You do not own this category');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Category updated: ${id} by user ${userId}`);
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    });

    if (!category) throw new NotFoundException('Category not found');
    if (category.isDefault) {
      throw new ForbiddenException('Cannot delete system default categories');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException('You do not own this category');
    }
    if (category._count.transactions > 0) {
      throw new BadRequestException('Cannot delete category with existing transactions');
    }

    await this.prisma.category.delete({ where: { id } });
    this.logger.log(`Category deleted: ${id} by user ${userId}`);
  }
}

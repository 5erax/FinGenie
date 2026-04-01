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
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { SavingPlanService } from './saving-plan.service';
import { CreateSavingPlanDto, UpdateSavingPlanDto, UpsertSafeMoneyDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Saving Plans')
@ApiBearerAuth()
@Controller('saving-plans')
export class SavingPlanController {
  constructor(private readonly savingPlanService: SavingPlanService) {}

  @Get()
  @ApiOperation({ summary: 'List all saving plans for the current user' })
  @ApiOkResponse({ description: 'List of saving plans with safe money config' })
  async findAll(@CurrentUser() user: User) {
    return this.savingPlanService.findAllByUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new saving plan' })
  @ApiCreatedResponse({ description: 'Saving plan created successfully' })
  async create(@CurrentUser() user: User, @Body() dto: CreateSavingPlanDto) {
    return this.savingPlanService.create(user.id, dto);
  }

  // NOTE: /current must be declared BEFORE /:id to prevent route shadowing
  @Get('current')
  @ApiOperation({ summary: 'Get the most recent saving plan for the current user' })
  @ApiOkResponse({ description: 'Most recent saving plan with safe money config' })
  async findCurrent(@CurrentUser() user: User) {
    return this.savingPlanService.findByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific saving plan by ID' })
  @ApiOkResponse({ description: 'Saving plan details with safe money config' })
  @ApiNotFoundResponse({ description: 'Saving plan not found' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.savingPlanService.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saving plan' })
  @ApiOkResponse({ description: 'Saving plan updated successfully' })
  @ApiNotFoundResponse({ description: 'Saving plan not found' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateSavingPlanDto,
  ) {
    return this.savingPlanService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saving plan' })
  @ApiNoContentResponse({ description: 'Saving plan deleted successfully' })
  @ApiNotFoundResponse({ description: 'Saving plan not found' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.savingPlanService.remove(user.id, id);
  }

  @Put(':id/safe-money')
  @ApiOperation({ summary: 'Create or update the safe money config for a saving plan' })
  @ApiOkResponse({ description: 'Safe money config upserted successfully' })
  @ApiNotFoundResponse({ description: 'Saving plan not found' })
  async upsertSafeMoney(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpsertSafeMoneyDto,
  ) {
    return this.savingPlanService.upsertSafeMoneyConfig(user.id, id, dto);
  }

  @Get(':id/check')
  @ApiOperation({ summary: 'Check today\'s spending against daily budget and safe money threshold' })
  @ApiOkResponse({ description: 'Spending alert data' })
  @ApiNotFoundResponse({ description: 'Saving plan not found' })
  async checkSpending(@CurrentUser() user: User, @Param('id') id: string) {
    return this.savingPlanService.checkSpendingAlert(user.id, id);
  }
}

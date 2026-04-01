import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AlertService } from './alert.service';
import { QueryAlertsDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  @ApiOperation({ summary: 'List all alerts for the current user' })
  @ApiOkResponse({ description: 'Paginated list of alerts' })
  async findAll(@CurrentUser() user: User, @Query() query: QueryAlertsDto) {
    return this.alertService.findAllByUser(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread alert count for the current user' })
  @ApiOkResponse({ description: 'Unread alert count' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.alertService.getUnreadCount(user.id);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an alert by ID' })
  @ApiOkResponse({ description: 'Alert details' })
  @ApiNotFoundResponse({ description: 'Alert not found' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.alertService.findById(user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all alerts as read' })
  @ApiOkResponse({ description: 'Number of alerts marked as read' })
  async markAllAsRead(@CurrentUser() user: User) {
    return this.alertService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark an alert as read' })
  @ApiOkResponse({ description: 'Alert marked as read' })
  @ApiNotFoundResponse({ description: 'Alert not found' })
  async markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.alertService.markAsRead(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an alert' })
  @ApiNoContentResponse({ description: 'Alert deleted successfully' })
  @ApiNotFoundResponse({ description: 'Alert not found' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.alertService.remove(user.id, id);
  }
}

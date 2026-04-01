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
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { WalletService } from './wallet.service';
import { CreateWalletDto, UpdateWalletDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Wallets')
@ApiBearerAuth()
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'List all wallets for the current user' })
  @ApiOkResponse({ description: 'List of wallets with transaction counts' })
  async findAll(@CurrentUser() user: User) {
    return this.walletService.findAllByUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiCreatedResponse({ description: 'Wallet created successfully' })
  async create(@CurrentUser() user: User, @Body() dto: CreateWalletDto) {
    return this.walletService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a wallet by ID' })
  @ApiOkResponse({ description: 'Wallet details' })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.walletService.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a wallet' })
  @ApiOkResponse({ description: 'Wallet updated successfully' })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.walletService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a wallet' })
  @ApiNoContentResponse({ description: 'Wallet deleted successfully' })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  @ApiBadRequestResponse({ description: 'Cannot delete wallet with existing transactions' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.walletService.remove(user.id, id);
  }
}

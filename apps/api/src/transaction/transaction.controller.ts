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
  Query,
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
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, QueryTransactionsDto, UpdateTransactionDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'List all transactions for the current user' })
  @ApiOkResponse({ description: 'Paginated list of transactions' })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.transactionService.findAllByUser(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiCreatedResponse({ description: 'Transaction created successfully' })
  @ApiNotFoundResponse({ description: 'Wallet or category not found' })
  @ApiBadRequestResponse({ description: 'Invalid transaction data' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionService.create(user.id, dto);
  }

  // NOTE: /summary must be declared before /:id so NestJS does not
  // treat the literal string "summary" as an id parameter.
  @Get('summary')
  @ApiOperation({ summary: 'Get income/expense summary for the current user' })
  @ApiOkResponse({ description: 'Aggregated totals: income, expense, net, count' })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  async getSummary(
    @CurrentUser() user: User,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.transactionService.getSummary(user.id, {
      walletId: query.walletId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiOkResponse({ description: 'Transaction with wallet and category relations' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.transactionService.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiOkResponse({ description: 'Transaction updated successfully' })
  @ApiNotFoundResponse({ description: 'Transaction or wallet not found' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction and reverse wallet balance' })
  @ApiNoContentResponse({ description: 'Transaction deleted successfully' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.transactionService.remove(user.id, id);
  }
}

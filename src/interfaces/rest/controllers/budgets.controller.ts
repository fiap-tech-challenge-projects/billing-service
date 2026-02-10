import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger'
import {
  CreateBudgetUseCase,
  ApproveBudgetUseCase,
  RejectBudgetUseCase,
  GetBudgetUseCase,
  ListBudgetsUseCase,
} from '@application/budgets/use-cases'
import {
  CreateBudgetDto,
  ApproveBudgetDto,
  RejectBudgetDto,
  BudgetResponseDto,
} from '@application/budgets/dtos'
import { BudgetStatus } from '@shared/value-objects'

@ApiTags('Budgets')
@Controller('api/v1/budgets')
export class BudgetsController {
  constructor(
    private readonly createBudgetUseCase: CreateBudgetUseCase,
    private readonly approveBudgetUseCase: ApproveBudgetUseCase,
    private readonly rejectBudgetUseCase: RejectBudgetUseCase,
    private readonly getBudgetUseCase: GetBudgetUseCase,
    private readonly listBudgetsUseCase: ListBudgetsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Budget created successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body() createBudgetDto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.createBudgetUseCase.execute(createBudgetDto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Budget found',
    type: BudgetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  async findOne(@Param('id') id: string): Promise<BudgetResponseDto> {
    return this.getBudgetUseCase.execute(id)
  }

  @Get()
  @ApiOperation({ summary: 'List budgets with filters' })
  @ApiQuery({
    name: 'serviceOrderId',
    required: false,
    description: 'Filter by service order ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BudgetStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results to return',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of results to skip',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of budgets',
  })
  async findAll(
    @Query('serviceOrderId') serviceOrderId?: string,
    @Query('status') status?: BudgetStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ budgets: BudgetResponseDto[]; total: number }> {
    return this.listBudgetsUseCase.execute({
      serviceOrderId,
      status,
      limit,
      offset,
    })
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Budget approved successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  async approve(@Param('id') id: string): Promise<BudgetResponseDto> {
    const dto: ApproveBudgetDto = { budgetId: id }
    return this.approveBudgetUseCase.execute(dto)
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Budget rejected successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<BudgetResponseDto> {
    const dto: RejectBudgetDto = { budgetId: id, reason }
    return this.rejectBudgetUseCase.execute(dto)
  }
}

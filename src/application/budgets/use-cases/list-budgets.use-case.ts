import { Injectable, Inject } from '@nestjs/common'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { BudgetStatus } from '@shared/value-objects'
import { BudgetResponseDto } from '../dtos'
import { BudgetMapper } from '../mappers/budget.mapper'

/**
 * Use case for listing budgets with filters
 */
@Injectable()
export class ListBudgetsUseCase {
  constructor(
    @Inject('IBudgetRepository')
    private readonly budgetRepository: IBudgetRepository
  ) {}

  async execute(filters?: {
    serviceOrderId?: string
    status?: BudgetStatus
    limit?: number
    offset?: number
  }): Promise<{ budgets: BudgetResponseDto[]; total: number }> {
    const { budgets, total } = await this.budgetRepository.findAll(filters)

    return {
      budgets: budgets.map((budget) => BudgetMapper.toResponseDto(budget)),
      total,
    }
  }
}

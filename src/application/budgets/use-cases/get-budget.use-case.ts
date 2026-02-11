import { Injectable, NotFoundException, Inject } from '@nestjs/common'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { BudgetResponseDto } from '../dtos'
import { BudgetMapper } from '../mappers/budget.mapper'

/**
 * Use case for retrieving a budget by ID
 */
@Injectable()
export class GetBudgetUseCase {
  constructor(
    @Inject('IBudgetRepository')
    private readonly budgetRepository: IBudgetRepository
  ) {}

  async execute(budgetId: string): Promise<BudgetResponseDto> {
    const budget = await this.budgetRepository.findById(budgetId)

    if (!budget) {
      throw new NotFoundException(`Budget with ID ${budgetId} not found`)
    }

    return BudgetMapper.toResponseDto(budget)
  }
}

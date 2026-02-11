import { Injectable, NotFoundException, Inject } from '@nestjs/common'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { IEventPublisher } from '@application/events/interfaces/event-publisher.interface'
import { ApproveBudgetDto, BudgetResponseDto } from '../dtos'
import { BudgetMapper } from '../mappers/budget.mapper'

/**
 * Use case for approving a budget
 */
@Injectable()
export class ApproveBudgetUseCase {
  constructor(
    @Inject('IBudgetRepository')
    private readonly budgetRepository: IBudgetRepository,
    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: ApproveBudgetDto): Promise<BudgetResponseDto> {
    // Find budget
    const budget = await this.budgetRepository.findById(dto.budgetId)

    if (!budget) {
      throw new NotFoundException(`Budget with ID ${dto.budgetId} not found`)
    }

    // Approve budget (domain logic validates state transition)
    budget.approve()

    // Persist changes
    const updatedBudget = await this.budgetRepository.update(budget)

    // Publish event
    await this.eventPublisher.publishBudgetApproved({
      budgetId: updatedBudget.id,
      serviceOrderId: updatedBudget.serviceOrderId,
      approvedAt: updatedBudget.approvedAt!,
    })

    // Return response DTO
    return BudgetMapper.toResponseDto(updatedBudget)
  }
}

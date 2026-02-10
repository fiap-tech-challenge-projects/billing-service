import { Injectable, NotFoundException } from '@nestjs/common'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { IEventPublisher } from '@application/events/interfaces/event-publisher.interface'
import { RejectBudgetDto, BudgetResponseDto } from '../dtos'
import { BudgetMapper } from '../mappers/budget.mapper'

/**
 * Use case for rejecting a budget
 */
@Injectable()
export class RejectBudgetUseCase {
  constructor(
    private readonly budgetRepository: IBudgetRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: RejectBudgetDto): Promise<BudgetResponseDto> {
    // Find budget
    const budget = await this.budgetRepository.findById(dto.budgetId)

    if (!budget) {
      throw new NotFoundException(`Budget with ID ${dto.budgetId} not found`)
    }

    // Reject budget (domain logic validates state transition and reason)
    budget.reject()

    // Persist changes
    const updatedBudget = await this.budgetRepository.update(budget)

    // Publish event
    await this.eventPublisher.publishBudgetRejected({
      budgetId: updatedBudget.id,
      serviceOrderId: updatedBudget.serviceOrderId,
      reason: dto.reason,
      rejectedAt: updatedBudget.rejectedAt!,
    })

    // Return response DTO
    return BudgetMapper.toResponseDto(updatedBudget)
  }
}

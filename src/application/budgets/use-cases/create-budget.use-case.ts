import { Injectable, NotFoundException } from '@nestjs/common'
import { Budget } from '@domain/budgets/entities'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { IEventPublisher } from '@application/events/interfaces/event-publisher.interface'
import { CreateBudgetDto, BudgetResponseDto } from '../dtos'
import { BudgetMapper } from '../mappers/budget.mapper'

/**
 * Use case for creating a budget from a service order
 */
@Injectable()
export class CreateBudgetUseCase {
  constructor(
    private readonly budgetRepository: IBudgetRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: CreateBudgetDto): Promise<BudgetResponseDto> {
    // Check if budget already exists for this service order
    const existingBudget = await this.budgetRepository.findByServiceOrderId(
      dto.serviceOrderId,
    )

    if (existingBudget) {
      throw new Error(
        `Budget already exists for service order ${dto.serviceOrderId}`,
      )
    }

    // Map DTO to domain
    const { serviceOrderId, items } = BudgetMapper.toDomain(dto)

    // Create budget entity
    const budget = Budget.create(serviceOrderId, items)

    // Persist budget
    const createdBudget = await this.budgetRepository.create(budget)

    // Publish event
    await this.eventPublisher.publishBudgetGenerated({
      budgetId: createdBudget.id,
      serviceOrderId: createdBudget.serviceOrderId,
      totalAmountInCents: createdBudget.totalAmount.amountInCents,
      currency: createdBudget.totalAmount.currency,
    })

    // Return response DTO
    return BudgetMapper.toResponseDto(createdBudget)
  }
}

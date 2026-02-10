import { Budget, BudgetItem } from '@domain/budgets/entities'
import { Money } from '@shared/value-objects'
import {
  BudgetResponseDto,
  BudgetItemResponseDto,
  CreateBudgetDto,
} from '../dtos'

/**
 * Mapper for Budget entity and DTOs
 */
export class BudgetMapper {
  /**
   * Map Budget entity to response DTO
   */
  static toResponseDto(budget: Budget): BudgetResponseDto {
    return {
      id: budget.id,
      serviceOrderId: budget.serviceOrderId,
      totalAmountInCents: budget.totalAmount.amountInCents,
      currency: budget.totalAmount.currency,
      status: budget.status,
      items: budget.items.map((item) => this.toItemResponseDto(item)),
      approvedAt: budget.approvedAt,
      rejectedAt: budget.rejectedAt,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    }
  }

  /**
   * Map BudgetItem entity to response DTO
   */
  static toItemResponseDto(item: BudgetItem): BudgetItemResponseDto {
    return {
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPriceInCents: item.unitPrice.amountInCents,
      totalPriceInCents: item.totalPrice.amountInCents,
      currency: item.unitPrice.currency,
    }
  }

  /**
   * Map create DTO to domain entities
   */
  static toDomain(dto: CreateBudgetDto): {
    serviceOrderId: string
    items: BudgetItem[]
  } {
    const items = dto.items.map((itemDto) => {
      const unitPrice = Money.create(
        itemDto.unitPriceInCents,
        itemDto.currency || 'BRL',
      )
      return BudgetItem.create(itemDto.description, itemDto.quantity, unitPrice)
    })

    return {
      serviceOrderId: dto.serviceOrderId,
      items,
    }
  }
}

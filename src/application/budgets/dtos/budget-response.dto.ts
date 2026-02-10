import { BudgetStatus } from '@shared/value-objects'

/**
 * DTO for budget response
 */
export class BudgetResponseDto {
  id: string
  serviceOrderId: string
  totalAmountInCents: number
  currency: string
  status: BudgetStatus
  items: BudgetItemResponseDto[]
  approvedAt?: Date
  rejectedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class BudgetItemResponseDto {
  id: string
  description: string
  quantity: number
  unitPriceInCents: number
  totalPriceInCents: number
  currency: string
}

/**
 * DTO for creating a budget
 */
export class CreateBudgetDto {
  serviceOrderId: string
  items: CreateBudgetItemDto[]
}

export class CreateBudgetItemDto {
  description: string
  quantity: number
  unitPriceInCents: number
  currency?: string
}

import { Money } from '@shared/value-objects'

/**
 * BudgetItem entity
 * Represents a line item in a budget
 */
export class BudgetItem {
  public readonly id: string
  public readonly description: string
  public readonly quantity: number
  public readonly unitPrice: Money
  public readonly totalPrice: Money

  constructor(
    id: string,
    description: string,
    quantity: number,
    unitPrice: Money,
  ) {
    if (!description || description.trim() === '') {
      throw new Error('Description cannot be empty')
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be positive')
    }

    this.id = id
    this.description = description
    this.quantity = quantity
    this.unitPrice = unitPrice
    this.totalPrice = unitPrice.multiply(quantity)
  }

  /**
   * Factory method to create a new budget item
   */
  public static create(
    description: string,
    quantity: number,
    unitPrice: Money,
  ): BudgetItem {
    return new BudgetItem('', description, quantity, unitPrice)
  }

  /**
   * Check equality based on description and price
   */
  equals(other: BudgetItem): boolean {
    return (
      this.description === other.description &&
      this.quantity === other.quantity &&
      this.unitPrice.equals(other.unitPrice)
    )
  }
}

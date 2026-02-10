import { BaseEntity } from '@shared/base'
import { Money, BudgetStatus } from '@shared/value-objects'
import { BudgetItem } from './budget-item.entity'
import { InvalidBudgetStatusTransitionException } from '../exceptions'

/**
 * Budget aggregate root
 * Represents a service order budget with approval workflow
 */
export class Budget extends BaseEntity {
  public readonly serviceOrderId: string
  public readonly totalAmount: Money
  public readonly status: BudgetStatus
  public readonly items: BudgetItem[]
  public readonly approvedAt?: Date
  public readonly rejectedAt?: Date

  constructor(
    id: string,
    serviceOrderId: string,
    totalAmount: Money,
    status: BudgetStatus,
    items: BudgetItem[],
    approvedAt: Date | undefined,
    rejectedAt: Date | undefined,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    super(id, createdAt, updatedAt)
    this.serviceOrderId = serviceOrderId
    this.totalAmount = totalAmount
    this.status = status
    this.items = items
    this.approvedAt = approvedAt
    this.rejectedAt = rejectedAt
  }

  /**
   * Factory method to create a new budget with PENDING status
   */
  public static create(
    serviceOrderId: string,
    items: BudgetItem[],
  ): Budget {
    if (!items || items.length === 0) {
      throw new Error('Budget must have at least one item')
    }

    // Calculate total amount
    let totalAmount = Money.create(0)
    for (const item of items) {
      totalAmount = totalAmount.add(item.totalPrice)
    }

    const now = new Date()
    return new Budget(
      '',
      serviceOrderId,
      totalAmount,
      BudgetStatus.PENDING,
      items,
      undefined,
      undefined,
      now,
      now,
    )
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(newStatus: BudgetStatus): void {
    const allowedTransitions: Record<BudgetStatus, BudgetStatus[]> = {
      [BudgetStatus.PENDING]: [BudgetStatus.APPROVED, BudgetStatus.REJECTED],
      [BudgetStatus.APPROVED]: [],
      [BudgetStatus.REJECTED]: [],
    }

    const allowedStatuses = allowedTransitions[this.status]
    if (!allowedStatuses.includes(newStatus)) {
      throw new InvalidBudgetStatusTransitionException(
        this.status,
        newStatus,
        allowedStatuses,
      )
    }
  }

  /**
   * Approve budget
   */
  public approve(): void {
    this.validateStatusTransition(BudgetStatus.APPROVED)
    ;(this as { status: BudgetStatus }).status = BudgetStatus.APPROVED
    ;(this as { approvedAt: Date }).approvedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Reject budget
   */
  public reject(): void {
    this.validateStatusTransition(BudgetStatus.REJECTED)
    ;(this as { status: BudgetStatus }).status = BudgetStatus.REJECTED
    ;(this as { rejectedAt: Date }).rejectedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Check if budget is in final state
   */
  public isInFinalState(): boolean {
    return this.status !== BudgetStatus.PENDING
  }

  /**
   * Check if budget can be modified
   */
  public canBeModified(): boolean {
    return this.status === BudgetStatus.PENDING
  }
}

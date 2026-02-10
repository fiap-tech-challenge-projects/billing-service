/**
 * Event publisher interface for publishing domain events to EventBridge
 */
export interface IEventPublisher {
  /**
   * Publish BudgetGenerated event
   */
  publishBudgetGenerated(data: {
    budgetId: string
    serviceOrderId: string
    totalAmountInCents: number
    currency: string
  }): Promise<void>

  /**
   * Publish BudgetApproved event
   */
  publishBudgetApproved(data: {
    budgetId: string
    serviceOrderId: string
    approvedAt: Date
  }): Promise<void>

  /**
   * Publish BudgetRejected event
   */
  publishBudgetRejected(data: {
    budgetId: string
    serviceOrderId: string
    reason: string
    rejectedAt: Date
  }): Promise<void>

  /**
   * Publish PaymentInitiated event
   */
  publishPaymentInitiated(data: {
    paymentId: string
    budgetId: string
    amountInCents: number
    currency: string
  }): Promise<void>

  /**
   * Publish PaymentCompleted event
   */
  publishPaymentCompleted(data: {
    paymentId: string
    budgetId: string
    serviceOrderId: string
    completedAt: Date
  }): Promise<void>

  /**
   * Publish PaymentFailed event
   */
  publishPaymentFailed(data: {
    paymentId: string
    budgetId: string
    reason: string
    failedAt: Date
  }): Promise<void>
}

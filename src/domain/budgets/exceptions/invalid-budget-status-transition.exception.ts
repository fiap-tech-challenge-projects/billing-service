import { DomainException } from '@shared/exceptions'
import { BudgetStatus } from '@shared/value-objects'

/**
 * Exception thrown when attempting an invalid budget status transition
 */
export class InvalidBudgetStatusTransitionException extends DomainException {
  constructor(
    currentStatus: BudgetStatus,
    attemptedStatus: BudgetStatus,
    allowedStatuses: BudgetStatus[],
  ) {
    const message = `Cannot transition from ${currentStatus} to ${attemptedStatus}. Allowed transitions: ${allowedStatuses.join(', ')}`
    super(message, 'INVALID_BUDGET_STATUS_TRANSITION')
  }
}

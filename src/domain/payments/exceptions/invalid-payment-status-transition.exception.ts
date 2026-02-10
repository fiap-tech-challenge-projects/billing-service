import { DomainException } from '@shared/exceptions'
import { PaymentStatus } from '@shared/value-objects'

/**
 * Exception thrown when an invalid payment status transition is attempted
 */
export class InvalidPaymentStatusTransitionException extends DomainException {
  constructor(
    from: PaymentStatus,
    to: PaymentStatus,
    allowedStatuses: PaymentStatus[],
  ) {
    super(
      `Invalid payment status transition from ${from} to ${to}. Allowed transitions: ${allowedStatuses.join(', ')}`,
      'INVALID_PAYMENT_STATUS_TRANSITION',
    )
  }
}

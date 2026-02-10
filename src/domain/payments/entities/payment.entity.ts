import { BaseEntity } from '@shared/base'
import { Money, PaymentStatus } from '@shared/value-objects'
import { InvalidPaymentStatusTransitionException } from '../exceptions'

/**
 * Payment aggregate root
 * Represents a payment transaction via Mercado Pago
 */
export class Payment extends BaseEntity {
  public readonly budgetId: string
  public readonly amount: Money
  public readonly status: PaymentStatus
  public readonly mercadoPagoPaymentId?: string
  public readonly qrCode?: string
  public readonly qrCodeBase64?: string
  public readonly completedAt?: Date
  public readonly failedAt?: Date
  public readonly refundedAt?: Date
  public readonly failureReason?: string

  constructor(
    id: string,
    budgetId: string,
    amount: Money,
    status: PaymentStatus,
    mercadoPagoPaymentId: string | undefined,
    qrCode: string | undefined,
    qrCodeBase64: string | undefined,
    completedAt: Date | undefined,
    failedAt: Date | undefined,
    refundedAt: Date | undefined,
    failureReason: string | undefined,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    super(id, createdAt, updatedAt)
    this.budgetId = budgetId
    this.amount = amount
    this.status = status
    this.mercadoPagoPaymentId = mercadoPagoPaymentId
    this.qrCode = qrCode
    this.qrCodeBase64 = qrCodeBase64
    this.completedAt = completedAt
    this.failedAt = failedAt
    this.refundedAt = refundedAt
    this.failureReason = failureReason
  }

  /**
   * Factory method to create a new pending payment
   */
  public static create(budgetId: string, amount: Money): Payment {
    if (!budgetId || budgetId.trim() === '') {
      throw new Error('Budget ID is required')
    }

    if (amount.amountInCents <= 0) {
      throw new Error('Payment amount must be positive')
    }

    const now = new Date()
    return new Payment(
      '',
      budgetId,
      amount,
      PaymentStatus.PENDING,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      now,
      now,
    )
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(newStatus: PaymentStatus): void {
    const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]: [PaymentStatus.PROCESSING, PaymentStatus.FAILED],
      [PaymentStatus.PROCESSING]: [
        PaymentStatus.COMPLETED,
        PaymentStatus.FAILED,
      ],
      [PaymentStatus.COMPLETED]: [PaymentStatus.REFUNDED],
      [PaymentStatus.FAILED]: [],
      [PaymentStatus.REFUNDED]: [],
    }

    const allowedStatuses = allowedTransitions[this.status]
    if (!allowedStatuses.includes(newStatus)) {
      throw new InvalidPaymentStatusTransitionException(
        this.status,
        newStatus,
        allowedStatuses,
      )
    }
  }

  /**
   * Set Mercado Pago payment ID and QR code after payment creation
   */
  public setMercadoPagoData(
    mercadoPagoPaymentId: string,
    qrCode: string,
    qrCodeBase64: string,
  ): void {
    if (this.status !== PaymentStatus.PENDING) {
      throw new Error(
        'Can only set Mercado Pago data for pending payments',
      )
    }

    ;(this as { mercadoPagoPaymentId: string }).mercadoPagoPaymentId =
      mercadoPagoPaymentId
    ;(this as { qrCode: string }).qrCode = qrCode
    ;(this as { qrCodeBase64: string }).qrCodeBase64 = qrCodeBase64
    ;(this as { status: PaymentStatus }).status = PaymentStatus.PROCESSING
    this.updatedAt = new Date()
  }

  /**
   * Mark payment as completed
   */
  public complete(): void {
    this.validateStatusTransition(PaymentStatus.COMPLETED)
    ;(this as { status: PaymentStatus }).status = PaymentStatus.COMPLETED
    ;(this as { completedAt: Date }).completedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Mark payment as failed
   */
  public fail(reason: string): void {
    this.validateStatusTransition(PaymentStatus.FAILED)
    ;(this as { status: PaymentStatus }).status = PaymentStatus.FAILED
    ;(this as { failedAt: Date }).failedAt = new Date()
    ;(this as { failureReason: string }).failureReason = reason
    this.updatedAt = new Date()
  }

  /**
   * Refund a completed payment
   */
  public refund(): void {
    this.validateStatusTransition(PaymentStatus.REFUNDED)
    ;(this as { status: PaymentStatus }).status = PaymentStatus.REFUNDED
    ;(this as { refundedAt: Date }).refundedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Check if payment is in final state
   */
  public isInFinalState(): boolean {
    return (
      this.status === PaymentStatus.COMPLETED ||
      this.status === PaymentStatus.FAILED ||
      this.status === PaymentStatus.REFUNDED
    )
  }

  /**
   * Check if payment can be refunded
   */
  public canBeRefunded(): boolean {
    return this.status === PaymentStatus.COMPLETED
  }
}

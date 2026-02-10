import { PaymentStatus } from '@shared/value-objects'

/**
 * DTO for payment response
 */
export class PaymentResponseDto {
  id: string
  budgetId: string
  amountInCents: number
  currency: string
  status: PaymentStatus
  mercadoPagoPaymentId?: string
  qrCode?: string
  qrCodeBase64?: string
  completedAt?: Date
  failedAt?: Date
  refundedAt?: Date
  failureReason?: string
  createdAt: Date
  updatedAt: Date
}

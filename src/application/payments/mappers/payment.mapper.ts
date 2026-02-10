import { Payment } from '@domain/payments/entities'
import { PaymentResponseDto, QrCodeResponseDto } from '../dtos'

/**
 * Mapper for Payment entity and DTOs
 */
export class PaymentMapper {
  /**
   * Map Payment entity to response DTO
   */
  static toResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      budgetId: payment.budgetId,
      amountInCents: payment.amount.amount,
      currency: payment.amount.currency,
      status: payment.status,
      mercadoPagoPaymentId: payment.mercadoPagoPaymentId,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      completedAt: payment.completedAt,
      failedAt: payment.failedAt,
      refundedAt: payment.refundedAt,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }
  }

  /**
   * Map Payment entity to QR code response DTO
   */
  static toQrCodeResponseDto(payment: Payment): QrCodeResponseDto {
    if (!payment.qrCode || !payment.qrCodeBase64) {
      throw new Error('Payment does not have QR code data')
    }

    return {
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
    }
  }
}

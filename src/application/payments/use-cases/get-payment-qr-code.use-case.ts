import { Injectable, NotFoundException } from '@nestjs/common'
import { IPaymentRepository } from '@domain/payments/repositories'
import { QrCodeResponseDto } from '../dtos'
import { PaymentMapper } from '../mappers/payment.mapper'

/**
 * Use case for retrieving payment QR code
 */
@Injectable()
export class GetPaymentQrCodeUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(paymentId: string): Promise<QrCodeResponseDto> {
    const payment = await this.paymentRepository.findById(paymentId)

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`)
    }

    return PaymentMapper.toQrCodeResponseDto(payment)
  }
}

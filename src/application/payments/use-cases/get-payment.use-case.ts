import { Injectable, NotFoundException } from '@nestjs/common'
import { IPaymentRepository } from '@domain/payments/repositories'
import { PaymentResponseDto } from '../dtos'
import { PaymentMapper } from '../mappers/payment.mapper'

/**
 * Use case for retrieving a payment by ID
 */
@Injectable()
export class GetPaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(paymentId)

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`)
    }

    return PaymentMapper.toResponseDto(payment)
  }
}

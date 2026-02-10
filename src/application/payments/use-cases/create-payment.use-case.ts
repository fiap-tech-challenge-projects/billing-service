import { Injectable, NotFoundException } from '@nestjs/common'
import { Payment } from '@domain/payments/entities'
import { IPaymentRepository } from '@domain/payments/repositories'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { IEventPublisher } from '@application/events/interfaces/event-publisher.interface'
import { IMercadoPagoService } from '@infra/payment/interfaces/mercado-pago-service.interface'
import { BudgetStatus } from '@shared/value-objects'
import { CreatePaymentDto, PaymentResponseDto } from '../dtos'
import { PaymentMapper } from '../mappers/payment.mapper'

/**
 * Use case for creating a payment
 */
@Injectable()
export class CreatePaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly budgetRepository: IBudgetRepository,
    private readonly mercadoPagoService: IMercadoPagoService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // Find budget
    const budget = await this.budgetRepository.findById(dto.budgetId)

    if (!budget) {
      throw new NotFoundException(`Budget with ID ${dto.budgetId} not found`)
    }

    // Check if budget is approved
    if (budget.status !== BudgetStatus.APPROVED) {
      throw new Error('Budget must be approved before creating payment')
    }

    // Check if payment already exists for this budget
    const existingPayment = await this.paymentRepository.findByBudgetId(
      dto.budgetId,
    )

    if (existingPayment) {
      throw new Error(`Payment already exists for budget ${dto.budgetId}`)
    }

    // Create payment entity
    const payment = Payment.create(dto.budgetId, budget.totalAmount)

    // Persist payment
    const createdPayment = await this.paymentRepository.create(payment)

    // Create Mercado Pago payment and get QR code
    const mercadoPagoPayment =
      await this.mercadoPagoService.createPayment({
        transactionAmount: budget.totalAmount.amount / 100,
        description: `Payment for budget ${budget.id}`,
        externalReference: createdPayment.id,
      })

    // Update payment with Mercado Pago data
    createdPayment.setMercadoPagoData(
      mercadoPagoPayment.id,
      mercadoPagoPayment.qrCode,
      mercadoPagoPayment.qrCodeBase64,
    )

    // Persist changes
    const updatedPayment = await this.paymentRepository.update(createdPayment)

    // Publish event
    await this.eventPublisher.publishPaymentInitiated({
      paymentId: updatedPayment.id,
      budgetId: updatedPayment.budgetId,
      amountInCents: updatedPayment.amount.amount,
      currency: updatedPayment.amount.currency,
    })

    // Return response DTO
    return PaymentMapper.toResponseDto(updatedPayment)
  }
}

import { Injectable, Logger, Inject } from '@nestjs/common'
import { IPaymentRepository } from '@domain/payments/repositories'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { IEventPublisher } from '@application/events/interfaces/event-publisher.interface'
import { IMercadoPagoService } from '@infra/payment/interfaces/mercado-pago-service.interface'

/**
 * Use case for processing Mercado Pago webhook notifications
 */
@Injectable()
export class ProcessWebhookUseCase {
  private readonly logger = new Logger(ProcessWebhookUseCase.name)

  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IBudgetRepository')
    private readonly budgetRepository: IBudgetRepository,
    @Inject('IMercadoPagoService')
    private readonly mercadoPagoService: IMercadoPagoService,
    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(data: {
    action: string
    data: { id: string }
  }): Promise<void> {
    this.logger.log(`Processing webhook: ${data.action} for payment ${data.data.id}`)

    // Only process payment updates
    if (data.action !== 'payment.updated') {
      this.logger.log(`Ignoring action: ${data.action}`)
      return
    }

    // Get payment details from Mercado Pago
    const mercadoPagoPayment = await this.mercadoPagoService.getPayment(
      data.data.id,
    )

    // Find payment by Mercado Pago ID
    const payment = await this.paymentRepository.findByMercadoPagoId(
      mercadoPagoPayment.id,
    )

    if (!payment) {
      this.logger.warn(
        `Payment not found for Mercado Pago ID ${mercadoPagoPayment.id}`,
      )
      return
    }

    // Check if payment is already in final state
    if (payment.isInFinalState()) {
      this.logger.log(`Payment ${payment.id} is already in final state`)
      return
    }

    // Process payment status
    if (mercadoPagoPayment.status === 'approved') {
      payment.complete()
      await this.paymentRepository.update(payment)

      // Find budget to get service order ID
      const budget = await this.budgetRepository.findById(payment.budgetId)

      // Publish event
      await this.eventPublisher.publishPaymentCompleted({
        paymentId: payment.id,
        budgetId: payment.budgetId,
        serviceOrderId: budget!.serviceOrderId,
        completedAt: payment.completedAt!,
      })

      this.logger.log(`Payment ${payment.id} completed`)
    } else if (
      mercadoPagoPayment.status === 'rejected' ||
      mercadoPagoPayment.status === 'cancelled'
    ) {
      payment.fail(mercadoPagoPayment.statusDetail || 'Payment rejected')
      await this.paymentRepository.update(payment)

      // Publish event
      await this.eventPublisher.publishPaymentFailed({
        paymentId: payment.id,
        budgetId: payment.budgetId,
        reason: mercadoPagoPayment.statusDetail || 'Payment rejected',
        failedAt: payment.failedAt!,
      })

      this.logger.log(`Payment ${payment.id} failed`)
    }
  }
}

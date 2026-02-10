import { ProcessWebhookUseCase } from './process-webhook.use-case'
import { Payment } from '@domain/payments/entities'
import { Budget, BudgetItem } from '@domain/budgets/entities'
import { IPaymentRepository } from '@domain/payments/repositories'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { IEventPublisher } from '@application/events/interfaces/event-publisher.interface'
import { IMercadoPagoService } from '@infra/payment/interfaces/mercado-pago-service.interface'
import { Money, PaymentStatus, BudgetStatus } from '@shared/value-objects'

describe('ProcessWebhookUseCase', () => {
  let useCase: ProcessWebhookUseCase
  let paymentRepository: jest.Mocked<IPaymentRepository>
  let budgetRepository: jest.Mocked<IBudgetRepository>
  let mercadoPagoService: jest.Mocked<IMercadoPagoService>
  let eventPublisher: jest.Mocked<IEventPublisher>

  const item1 = BudgetItem.create('Service', 1, Money.create(10000))
  const mockBudget = new Budget(
    'budget-123',
    'order-123',
    Money.create(10000),
    BudgetStatus.APPROVED,
    [item1],
    new Date(),
    undefined,
    new Date(),
    new Date(),
  )

  beforeEach(() => {
    paymentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBudgetId: jest.fn(),
      findByMercadoPagoId: jest.fn(),
      update: jest.fn(),
      findByStatus: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<IPaymentRepository>

    budgetRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByServiceOrderId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByStatus: jest.fn(),
    } as jest.Mocked<IBudgetRepository>

    mercadoPagoService = {
      createPayment: jest.fn(),
      getPayment: jest.fn(),
      refundPayment: jest.fn(),
    } as jest.Mocked<IMercadoPagoService>

    eventPublisher = {
      publishBudgetGenerated: jest.fn(),
      publishBudgetApproved: jest.fn(),
      publishBudgetRejected: jest.fn(),
      publishPaymentInitiated: jest.fn(),
      publishPaymentCompleted: jest.fn(),
      publishPaymentFailed: jest.fn(),
    } as jest.Mocked<IEventPublisher>

    useCase = new ProcessWebhookUseCase(
      paymentRepository,
      budgetRepository,
      mercadoPagoService,
      eventPublisher,
    )
  })

  describe('execute', () => {
    it('should process approved payment successfully', async () => {
      const webhookData = {
        action: 'payment.updated',
        data: { id: 'mp-123' },
      }

      const payment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(10000),
        PaymentStatus.PROCESSING,
        'mp-123',
        'qr',
        'base64',
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      mercadoPagoService.getPayment.mockResolvedValue({
        id: 'mp-123',
        status: 'approved',
        qrCode: 'qr',
        qrCodeBase64: 'base64',
      })
      paymentRepository.findByMercadoPagoId.mockResolvedValue(payment)
      budgetRepository.findById.mockResolvedValue(mockBudget)

      await useCase.execute(webhookData)

      expect(mercadoPagoService.getPayment).toHaveBeenCalledWith('mp-123')
      expect(paymentRepository.findByMercadoPagoId).toHaveBeenCalledWith('mp-123')
      expect(paymentRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.COMPLETED,
        }),
      )
      expect(eventPublisher.publishPaymentCompleted).toHaveBeenCalledWith({
        paymentId: 'payment-123',
        budgetId: 'budget-123',
        serviceOrderId: 'order-123',
        completedAt: expect.any(Date),
      })
    })

    it('should process rejected payment successfully', async () => {
      const webhookData = {
        action: 'payment.updated',
        data: { id: 'mp-123' },
      }

      const payment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(10000),
        PaymentStatus.PROCESSING,
        'mp-123',
        'qr',
        'base64',
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      mercadoPagoService.getPayment.mockResolvedValue({
        id: 'mp-123',
        status: 'rejected',
        statusDetail: 'Insufficient funds',
        qrCode: 'qr',
        qrCodeBase64: 'base64',
      })
      paymentRepository.findByMercadoPagoId.mockResolvedValue(payment)

      await useCase.execute(webhookData)

      expect(paymentRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.FAILED,
          failureReason: 'Insufficient funds',
        }),
      )
      expect(eventPublisher.publishPaymentFailed).toHaveBeenCalledWith({
        paymentId: 'payment-123',
        budgetId: 'budget-123',
        reason: 'Insufficient funds',
        failedAt: expect.any(Date),
      })
    })

    it('should process cancelled payment successfully', async () => {
      const webhookData = {
        action: 'payment.updated',
        data: { id: 'mp-123' },
      }

      const payment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(10000),
        PaymentStatus.PROCESSING,
        'mp-123',
        'qr',
        'base64',
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      mercadoPagoService.getPayment.mockResolvedValue({
        id: 'mp-123',
        status: 'cancelled',
        statusDetail: 'User cancelled',
        qrCode: 'qr',
        qrCodeBase64: 'base64',
      })
      paymentRepository.findByMercadoPagoId.mockResolvedValue(payment)

      await useCase.execute(webhookData)

      expect(paymentRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.FAILED,
          failureReason: 'User cancelled',
        }),
      )
      expect(eventPublisher.publishPaymentFailed).toHaveBeenCalled()
    })

    it('should use default reason when statusDetail is not provided', async () => {
      const webhookData = {
        action: 'payment.updated',
        data: { id: 'mp-123' },
      }

      const payment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(10000),
        PaymentStatus.PROCESSING,
        'mp-123',
        'qr',
        'base64',
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      mercadoPagoService.getPayment.mockResolvedValue({
        id: 'mp-123',
        status: 'rejected',
        qrCode: 'qr',
        qrCodeBase64: 'base64',
      })
      paymentRepository.findByMercadoPagoId.mockResolvedValue(payment)

      await useCase.execute(webhookData)

      expect(eventPublisher.publishPaymentFailed).toHaveBeenCalledWith({
        paymentId: 'payment-123',
        budgetId: 'budget-123',
        reason: 'Payment rejected',
        failedAt: expect.any(Date),
      })
    })

    it('should ignore non-payment.updated actions', async () => {
      const webhookData = {
        action: 'payment.created',
        data: { id: 'mp-123' },
      }

      await useCase.execute(webhookData)

      expect(mercadoPagoService.getPayment).not.toHaveBeenCalled()
      expect(paymentRepository.findByMercadoPagoId).not.toHaveBeenCalled()
      expect(paymentRepository.update).not.toHaveBeenCalled()
      expect(eventPublisher.publishPaymentCompleted).not.toHaveBeenCalled()
      expect(eventPublisher.publishPaymentFailed).not.toHaveBeenCalled()
    })

    it('should return early when payment not found', async () => {
      const webhookData = {
        action: 'payment.updated',
        data: { id: 'mp-unknown' },
      }

      mercadoPagoService.getPayment.mockResolvedValue({
        id: 'mp-unknown',
        status: 'approved',
        qrCode: 'qr',
        qrCodeBase64: 'base64',
      })
      paymentRepository.findByMercadoPagoId.mockResolvedValue(null)

      await useCase.execute(webhookData)

      expect(paymentRepository.update).not.toHaveBeenCalled()
      expect(eventPublisher.publishPaymentCompleted).not.toHaveBeenCalled()
    })

    it('should return early when payment is already in final state', async () => {
      const webhookData = {
        action: 'payment.updated',
        data: { id: 'mp-123' },
      }

      const completedPayment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(10000),
        PaymentStatus.COMPLETED,
        'mp-123',
        'qr',
        'base64',
        new Date(),
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      mercadoPagoService.getPayment.mockResolvedValue({
        id: 'mp-123',
        status: 'approved',
        qrCode: 'qr',
        qrCodeBase64: 'base64',
      })
      paymentRepository.findByMercadoPagoId.mockResolvedValue(completedPayment)

      await useCase.execute(webhookData)

      expect(paymentRepository.update).not.toHaveBeenCalled()
      expect(eventPublisher.publishPaymentCompleted).not.toHaveBeenCalled()
    })

    it('should ignore pending status from Mercado Pago', async () => {
      const webhookData = {
        action: 'payment.updated',
        data: { id: 'mp-123' },
      }

      const payment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(10000),
        PaymentStatus.PROCESSING,
        'mp-123',
        'qr',
        'base64',
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      mercadoPagoService.getPayment.mockResolvedValue({
        id: 'mp-123',
        status: 'pending',
        qrCode: 'qr',
        qrCodeBase64: 'base64',
      })
      paymentRepository.findByMercadoPagoId.mockResolvedValue(payment)

      await useCase.execute(webhookData)

      expect(paymentRepository.update).not.toHaveBeenCalled()
      expect(eventPublisher.publishPaymentCompleted).not.toHaveBeenCalled()
      expect(eventPublisher.publishPaymentFailed).not.toHaveBeenCalled()
    })

    it('should handle webhook for payment from PENDING status', async () => {
      const webhookData = {
        action: 'payment.updated',
        data: { id: 'mp-123' },
      }

      const pendingPayment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(10000),
        PaymentStatus.PENDING,
        'mp-123',
        'qr',
        'base64',
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      mercadoPagoService.getPayment.mockResolvedValue({
        id: 'mp-123',
        status: 'rejected',
        statusDetail: 'Invalid',
        qrCode: 'qr',
        qrCodeBase64: 'base64',
      })
      paymentRepository.findByMercadoPagoId.mockResolvedValue(pendingPayment)

      await useCase.execute(webhookData)

      expect(paymentRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.FAILED,
        }),
      )
    })
  })
})

import { CreatePaymentUseCase } from './create-payment.use-case'
import { Payment } from '@domain/payments/entities'
import { Budget, BudgetItem } from '@domain/budgets/entities'
import { IPaymentRepository } from '@domain/payments/repositories'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { IEventPublisher } from '@application/events/interfaces/event-publisher.interface'
import { IMercadoPagoService } from '@infra/payment/interfaces/mercado-pago-service.interface'
import { CreatePaymentDto } from '../dtos'
import { Money, BudgetStatus, PaymentStatus } from '@shared/value-objects'
import { NotFoundException } from '@nestjs/common'

describe('CreatePaymentUseCase', () => {
  let useCase: CreatePaymentUseCase
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

    useCase = new CreatePaymentUseCase(
      paymentRepository,
      budgetRepository,
      mercadoPagoService,
      eventPublisher,
    )
  })

  describe('execute', () => {
    it('should create payment successfully', async () => {
      const dto: CreatePaymentDto = {
        budgetId: 'budget-123',
      }

      const createdPayment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(10000),
        PaymentStatus.PENDING,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      const updatedPayment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(10000),
        PaymentStatus.PROCESSING,
        'mp-456',
        'qr-code-data',
        'qr-base64-data',
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      budgetRepository.findById.mockResolvedValue(mockBudget)
      paymentRepository.findByBudgetId.mockResolvedValue(null)
      paymentRepository.create.mockResolvedValue(createdPayment)
      mercadoPagoService.createPayment.mockResolvedValue({
        id: 'mp-456',
        status: 'pending',
        qrCode: 'qr-code-data',
        qrCodeBase64: 'qr-base64-data',
      })
      paymentRepository.update.mockResolvedValue(updatedPayment)

      const result = await useCase.execute(dto)

      expect(result).toEqual({
        id: 'payment-123',
        budgetId: 'budget-123',
        amountInCents: 10000,
        currency: 'BRL',
        status: PaymentStatus.PROCESSING,
        mercadoPagoPaymentId: 'mp-456',
        qrCode: 'qr-code-data',
        qrCodeBase64: 'qr-base64-data',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })

      expect(budgetRepository.findById).toHaveBeenCalledWith('budget-123')
      expect(paymentRepository.findByBudgetId).toHaveBeenCalledWith('budget-123')
      expect(paymentRepository.create).toHaveBeenCalledWith(expect.any(Payment))
      expect(mercadoPagoService.createPayment).toHaveBeenCalledWith({
        transactionAmount: 100, // 10000 cents / 100
        description: 'Payment for budget budget-123',
        externalReference: 'payment-123',
      })
      expect(paymentRepository.update).toHaveBeenCalledWith(expect.any(Payment))
      expect(eventPublisher.publishPaymentInitiated).toHaveBeenCalledWith({
        paymentId: 'payment-123',
        budgetId: 'budget-123',
        amountInCents: 10000,
        currency: 'BRL',
      })
    })

    it('should throw error when budget not found', async () => {
      const dto: CreatePaymentDto = {
        budgetId: 'non-existent',
      }

      budgetRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(dto)).rejects.toThrow(
        NotFoundException,
      )
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Budget with ID non-existent not found',
      )

      expect(paymentRepository.findByBudgetId).not.toHaveBeenCalled()
      expect(paymentRepository.create).not.toHaveBeenCalled()
      expect(mercadoPagoService.createPayment).not.toHaveBeenCalled()
      expect(eventPublisher.publishPaymentInitiated).not.toHaveBeenCalled()
    })

    it('should throw error when budget is not approved', async () => {
      const dto: CreatePaymentDto = {
        budgetId: 'budget-123',
      }

      const pendingBudget = new Budget(
        'budget-123',
        'order-123',
        Money.create(10000),
        BudgetStatus.PENDING,
        [item1],
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      budgetRepository.findById.mockResolvedValue(pendingBudget)

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Budget must be approved before creating payment',
      )

      expect(paymentRepository.create).not.toHaveBeenCalled()
      expect(mercadoPagoService.createPayment).not.toHaveBeenCalled()
      expect(eventPublisher.publishPaymentInitiated).not.toHaveBeenCalled()
    })

    it('should throw error when budget is rejected', async () => {
      const dto: CreatePaymentDto = {
        budgetId: 'budget-123',
      }

      const rejectedBudget = new Budget(
        'budget-123',
        'order-123',
        Money.create(10000),
        BudgetStatus.REJECTED,
        [item1],
        undefined,
        new Date(),
        new Date(),
        new Date(),
      )

      budgetRepository.findById.mockResolvedValue(rejectedBudget)

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Budget must be approved before creating payment',
      )

      expect(paymentRepository.create).not.toHaveBeenCalled()
      expect(mercadoPagoService.createPayment).not.toHaveBeenCalled()
    })

    it('should throw error when payment already exists for budget', async () => {
      const dto: CreatePaymentDto = {
        budgetId: 'budget-123',
      }

      const existingPayment = new Payment(
        'payment-existing',
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

      budgetRepository.findById.mockResolvedValue(mockBudget)
      paymentRepository.findByBudgetId.mockResolvedValue(existingPayment)

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Payment already exists for budget budget-123',
      )

      expect(paymentRepository.create).not.toHaveBeenCalled()
      expect(mercadoPagoService.createPayment).not.toHaveBeenCalled()
      expect(eventPublisher.publishPaymentInitiated).not.toHaveBeenCalled()
    })

    it('should convert amount to decimal for Mercado Pago', async () => {
      const dto: CreatePaymentDto = {
        budgetId: 'budget-123',
      }

      const budgetWithLargeAmount = new Budget(
        'budget-123',
        'order-123',
        Money.create(125050), // R$ 1,250.50
        BudgetStatus.APPROVED,
        [item1],
        new Date(),
        undefined,
        new Date(),
        new Date(),
      )

      const createdPayment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(125050),
        PaymentStatus.PENDING,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      const updatedPayment = new Payment(
        'payment-123',
        'budget-123',
        Money.create(125050),
        PaymentStatus.PROCESSING,
        'mp-456',
        'qr',
        'base64',
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      budgetRepository.findById.mockResolvedValue(budgetWithLargeAmount)
      paymentRepository.findByBudgetId.mockResolvedValue(null)
      paymentRepository.create.mockResolvedValue(createdPayment)
      mercadoPagoService.createPayment.mockResolvedValue({
        id: 'mp-456',
        status: 'pending',
        qrCode: 'qr',
        qrCodeBase64: 'base64',
      })
      paymentRepository.update.mockResolvedValue(updatedPayment)

      await useCase.execute(dto)

      expect(mercadoPagoService.createPayment).toHaveBeenCalledWith({
        transactionAmount: 1250.5,
        description: expect.any(String),
        externalReference: expect.any(String),
      })
    })
  })
})

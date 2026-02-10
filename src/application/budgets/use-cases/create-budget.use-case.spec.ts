import { CreateBudgetUseCase } from './create-budget.use-case'
import { Budget, BudgetItem } from '@domain/budgets/entities'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { IEventPublisher } from '@application/events/interfaces/event-publisher.interface'
import { CreateBudgetDto } from '../dtos'
import { Money, BudgetStatus } from '@shared/value-objects'

describe('CreateBudgetUseCase', () => {
  let useCase: CreateBudgetUseCase
  let budgetRepository: jest.Mocked<IBudgetRepository>
  let eventPublisher: jest.Mocked<IEventPublisher>

  beforeEach(() => {
    budgetRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByServiceOrderId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByStatus: jest.fn(),
    } as jest.Mocked<IBudgetRepository>

    eventPublisher = {
      publishBudgetGenerated: jest.fn(),
      publishBudgetApproved: jest.fn(),
      publishBudgetRejected: jest.fn(),
      publishPaymentInitiated: jest.fn(),
      publishPaymentCompleted: jest.fn(),
      publishPaymentFailed: jest.fn(),
    } as jest.Mocked<IEventPublisher>

    useCase = new CreateBudgetUseCase(budgetRepository, eventPublisher)
  })

  describe('execute', () => {
    it('should create budget successfully', async () => {
      const dto: CreateBudgetDto = {
        serviceOrderId: 'order-123',
        items: [
          {
            description: 'Oil change',
            quantity: 1,
            unitPriceInCents: 5000,
            currency: 'BRL',
          },
          {
            description: 'Filter replacement',
            quantity: 2,
            unitPriceInCents: 3000,
            currency: 'BRL',
          },
        ],
      }

      const item1 = BudgetItem.create('Oil change', 1, Money.create(5000))
      const item2 = BudgetItem.create('Filter replacement', 2, Money.create(3000))
      const createdBudget = new Budget(
        'budget-123',
        'order-123',
        Money.create(11000),
        BudgetStatus.PENDING,
        [item1, item2],
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      budgetRepository.findByServiceOrderId.mockResolvedValue(null)
      budgetRepository.create.mockResolvedValue(createdBudget)

      const result = await useCase.execute(dto)

      expect(result).toEqual({
        id: 'budget-123',
        serviceOrderId: 'order-123',
        totalAmountInCents: 11000,
        currency: 'BRL',
        status: BudgetStatus.PENDING,
        items: [
          {
            id: '',
            description: 'Oil change',
            quantity: 1,
            unitPriceInCents: 5000,
            totalPriceInCents: 5000,
            currency: 'BRL',
          },
          {
            id: '',
            description: 'Filter replacement',
            quantity: 2,
            unitPriceInCents: 3000,
            totalPriceInCents: 6000,
            currency: 'BRL',
          },
        ],
        approvedAt: undefined,
        rejectedAt: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })

      expect(budgetRepository.findByServiceOrderId).toHaveBeenCalledWith('order-123')
      expect(budgetRepository.create).toHaveBeenCalledWith(expect.any(Budget))
      expect(eventPublisher.publishBudgetGenerated).toHaveBeenCalledWith({
        budgetId: 'budget-123',
        serviceOrderId: 'order-123',
        totalAmountInCents: 11000,
        currency: 'BRL',
      })
    })

    it('should throw error when budget already exists for service order', async () => {
      const dto: CreateBudgetDto = {
        serviceOrderId: 'order-123',
        items: [
          {
            description: 'Service',
            quantity: 1,
            unitPriceInCents: 5000,
            currency: 'BRL',
          },
        ],
      }

      const existingBudget = new Budget(
        'budget-existing',
        'order-123',
        Money.create(5000),
        BudgetStatus.PENDING,
        [],
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      budgetRepository.findByServiceOrderId.mockResolvedValue(existingBudget)

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Budget already exists for service order order-123',
      )

      expect(budgetRepository.create).not.toHaveBeenCalled()
      expect(eventPublisher.publishBudgetGenerated).not.toHaveBeenCalled()
    })

    it('should create budget with single item', async () => {
      const dto: CreateBudgetDto = {
        serviceOrderId: 'order-456',
        items: [
          {
            description: 'Brake service',
            quantity: 4,
            unitPriceInCents: 2500,
            currency: 'BRL',
          },
        ],
      }

      const item = BudgetItem.create('Brake service', 4, Money.create(2500))
      const createdBudget = new Budget(
        'budget-456',
        'order-456',
        Money.create(10000),
        BudgetStatus.PENDING,
        [item],
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      budgetRepository.findByServiceOrderId.mockResolvedValue(null)
      budgetRepository.create.mockResolvedValue(createdBudget)

      const result = await useCase.execute(dto)

      expect(result.items).toHaveLength(1)
      expect(result.totalAmountInCents).toBe(10000)
    })

    it('should use default currency if not provided', async () => {
      const dto: CreateBudgetDto = {
        serviceOrderId: 'order-789',
        items: [
          {
            description: 'Service',
            quantity: 1,
            unitPriceInCents: 5000,
          },
        ],
      }

      const item = BudgetItem.create('Service', 1, Money.create(5000, 'BRL'))
      const createdBudget = new Budget(
        'budget-789',
        'order-789',
        Money.create(5000),
        BudgetStatus.PENDING,
        [item],
        undefined,
        undefined,
        new Date(),
        new Date(),
      )

      budgetRepository.findByServiceOrderId.mockResolvedValue(null)
      budgetRepository.create.mockResolvedValue(createdBudget)

      await useCase.execute(dto)

      const createCall = budgetRepository.create.mock.calls[0][0] as Budget
      expect(createCall.totalAmount.currency).toBe('BRL')
    })
  })
})

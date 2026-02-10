import { Budget } from './budget.entity'
import { BudgetItem } from './budget-item.entity'
import { Money, BudgetStatus } from '@shared/value-objects'
import { InvalidBudgetStatusTransitionException } from '../exceptions'

describe('Budget Entity', () => {
  const serviceOrderId = 'order-123'
  const item1 = BudgetItem.create('Oil change', 1, Money.create(5000))
  const item2 = BudgetItem.create('Filter replacement', 2, Money.create(3000))

  describe('create', () => {
    it('should create budget with PENDING status', () => {
      const budget = Budget.create(serviceOrderId, [item1, item2])

      expect(budget).toBeInstanceOf(Budget)
      expect(budget.serviceOrderId).toBe(serviceOrderId)
      expect(budget.status).toBe(BudgetStatus.PENDING)
      expect(budget.items).toHaveLength(2)
      expect(budget.approvedAt).toBeUndefined()
      expect(budget.rejectedAt).toBeUndefined()
    })

    it('should calculate total amount correctly', () => {
      const budget = Budget.create(serviceOrderId, [item1, item2])

      // item1: 5000, item2: 2 * 3000 = 6000, total = 11000
      expect(budget.totalAmount.amount).toBe(11000)
    })

    it('should throw error when items array is empty', () => {
      expect(() => {
        Budget.create(serviceOrderId, [])
      }).toThrow('Budget must have at least one item')
    })

    it('should throw error when items is undefined', () => {
      expect(() => {
        Budget.create(serviceOrderId, undefined as any)
      }).toThrow('Budget must have at least one item')
    })

    it('should create budget with empty id', () => {
      const budget = Budget.create(serviceOrderId, [item1])

      expect(budget.id).toBe('')
    })
  })

  describe('approve', () => {
    it('should approve pending budget', () => {
      const budget = Budget.create(serviceOrderId, [item1])

      budget.approve()

      expect(budget.status).toBe(BudgetStatus.APPROVED)
      expect(budget.approvedAt).toBeInstanceOf(Date)
      expect(budget.rejectedAt).toBeUndefined()
    })

    it('should update updatedAt timestamp', async () => {
      const budget = Budget.create(serviceOrderId, [item1])
      const originalUpdatedAt = budget.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      budget.approve()

      expect(budget.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error when approving already approved budget', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.approve()

      expect(() => {
        budget.approve()
      }).toThrow(InvalidBudgetStatusTransitionException)
    })

    it('should throw error when approving rejected budget', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.reject()

      expect(() => {
        budget.approve()
      }).toThrow(InvalidBudgetStatusTransitionException)
    })
  })

  describe('reject', () => {
    it('should reject pending budget', () => {
      const budget = Budget.create(serviceOrderId, [item1])

      budget.reject()

      expect(budget.status).toBe(BudgetStatus.REJECTED)
      expect(budget.rejectedAt).toBeInstanceOf(Date)
      expect(budget.approvedAt).toBeUndefined()
    })

    it('should update updatedAt timestamp', async () => {
      const budget = Budget.create(serviceOrderId, [item1])
      const originalUpdatedAt = budget.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      budget.reject()

      expect(budget.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error when rejecting already rejected budget', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.reject()

      expect(() => {
        budget.reject()
      }).toThrow(InvalidBudgetStatusTransitionException)
    })

    it('should throw error when rejecting approved budget', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.approve()

      expect(() => {
        budget.reject()
      }).toThrow(InvalidBudgetStatusTransitionException)
    })
  })

  describe('isInFinalState', () => {
    it('should return false for PENDING status', () => {
      const budget = Budget.create(serviceOrderId, [item1])

      expect(budget.isInFinalState()).toBe(false)
    })

    it('should return true for APPROVED status', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.approve()

      expect(budget.isInFinalState()).toBe(true)
    })

    it('should return true for REJECTED status', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.reject()

      expect(budget.isInFinalState()).toBe(true)
    })
  })

  describe('canBeModified', () => {
    it('should return true for PENDING status', () => {
      const budget = Budget.create(serviceOrderId, [item1])

      expect(budget.canBeModified()).toBe(true)
    })

    it('should return false for APPROVED status', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.approve()

      expect(budget.canBeModified()).toBe(false)
    })

    it('should return false for REJECTED status', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.reject()

      expect(budget.canBeModified()).toBe(false)
    })
  })

  describe('status transitions - valid', () => {
    it('should allow transition from PENDING to APPROVED', () => {
      const budget = Budget.create(serviceOrderId, [item1])

      expect(() => budget.approve()).not.toThrow()
      expect(budget.status).toBe(BudgetStatus.APPROVED)
    })

    it('should allow transition from PENDING to REJECTED', () => {
      const budget = Budget.create(serviceOrderId, [item1])

      expect(() => budget.reject()).not.toThrow()
      expect(budget.status).toBe(BudgetStatus.REJECTED)
    })
  })

  describe('status transitions - invalid', () => {
    it('should not allow transition from APPROVED to REJECTED', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.approve()

      expect(() => budget.reject()).toThrow(InvalidBudgetStatusTransitionException)
    })

    it('should not allow transition from REJECTED to APPROVED', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.reject()

      expect(() => budget.approve()).toThrow(InvalidBudgetStatusTransitionException)
    })

    it('should not allow transition from APPROVED to APPROVED', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.approve()

      expect(() => budget.approve()).toThrow(InvalidBudgetStatusTransitionException)
    })

    it('should not allow transition from REJECTED to REJECTED', () => {
      const budget = Budget.create(serviceOrderId, [item1])
      budget.reject()

      expect(() => budget.reject()).toThrow(InvalidBudgetStatusTransitionException)
    })
  })
})

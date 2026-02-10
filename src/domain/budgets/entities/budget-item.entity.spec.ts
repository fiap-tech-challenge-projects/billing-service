import { BudgetItem } from './budget-item.entity'
import { Money } from '@shared/value-objects'

describe('BudgetItem Entity', () => {
  const validDescription = 'Oil change'
  const validQuantity = 2
  const validUnitPrice = Money.create(5000) // R$ 50.00

  describe('constructor', () => {
    it('should create budget item successfully', () => {
      const item = new BudgetItem(
        'item-123',
        validDescription,
        validQuantity,
        validUnitPrice,
      )

      expect(item).toBeInstanceOf(BudgetItem)
      expect(item.id).toBe('item-123')
      expect(item.description).toBe(validDescription)
      expect(item.quantity).toBe(validQuantity)
      expect(item.unitPrice).toEqual(validUnitPrice)
      expect(item.totalPrice.amount).toBe(10000) // R$ 100.00
    })

    it('should calculate total price correctly', () => {
      const item = new BudgetItem('item-123', validDescription, 3, validUnitPrice)

      expect(item.totalPrice.amount).toBe(15000) // R$ 150.00
    })

    it('should throw error when description is empty', () => {
      expect(() => {
        new BudgetItem('item-123', '', validQuantity, validUnitPrice)
      }).toThrow('Description cannot be empty')
    })

    it('should throw error when description is only whitespace', () => {
      expect(() => {
        new BudgetItem('item-123', '   ', validQuantity, validUnitPrice)
      }).toThrow('Description cannot be empty')
    })

    it('should throw error when quantity is zero', () => {
      expect(() => {
        new BudgetItem('item-123', validDescription, 0, validUnitPrice)
      }).toThrow('Quantity must be positive')
    })

    it('should throw error when quantity is negative', () => {
      expect(() => {
        new BudgetItem('item-123', validDescription, -1, validUnitPrice)
      }).toThrow('Quantity must be positive')
    })
  })

  describe('create', () => {
    it('should create budget item with empty id', () => {
      const item = BudgetItem.create(validDescription, validQuantity, validUnitPrice)

      expect(item.id).toBe('')
      expect(item.description).toBe(validDescription)
      expect(item.quantity).toBe(validQuantity)
      expect(item.unitPrice).toEqual(validUnitPrice)
    })

    it('should calculate total price correctly', () => {
      const item = BudgetItem.create('Service', 5, Money.create(2000))

      expect(item.totalPrice.amount).toBe(10000)
    })
  })

  describe('equals', () => {
    it('should return true for items with same description, quantity and price', () => {
      const item1 = new BudgetItem('id-1', validDescription, validQuantity, validUnitPrice)
      const item2 = new BudgetItem('id-2', validDescription, validQuantity, validUnitPrice)

      expect(item1.equals(item2)).toBe(true)
    })

    it('should return false for items with different description', () => {
      const item1 = new BudgetItem('id-1', 'Service A', validQuantity, validUnitPrice)
      const item2 = new BudgetItem('id-2', 'Service B', validQuantity, validUnitPrice)

      expect(item1.equals(item2)).toBe(false)
    })

    it('should return false for items with different quantity', () => {
      const item1 = new BudgetItem('id-1', validDescription, 2, validUnitPrice)
      const item2 = new BudgetItem('id-2', validDescription, 3, validUnitPrice)

      expect(item1.equals(item2)).toBe(false)
    })

    it('should return false for items with different price', () => {
      const item1 = new BudgetItem('id-1', validDescription, validQuantity, Money.create(5000))
      const item2 = new BudgetItem('id-2', validDescription, validQuantity, Money.create(6000))

      expect(item1.equals(item2)).toBe(false)
    })

    it('should ignore id when comparing equality', () => {
      const item1 = new BudgetItem('different-id-1', validDescription, validQuantity, validUnitPrice)
      const item2 = new BudgetItem('different-id-2', validDescription, validQuantity, validUnitPrice)

      expect(item1.equals(item2)).toBe(true)
    })
  })
})

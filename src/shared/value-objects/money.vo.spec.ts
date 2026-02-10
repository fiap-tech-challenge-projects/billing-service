import { Money } from './money.vo'

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create money with default currency BRL', () => {
      const money = Money.create(10000)

      expect(money).toBeInstanceOf(Money)
      expect(money.amount).toBe(10000)
      expect(money.currency).toBe('BRL')
      expect(money.majorAmount).toBe(100)
    })

    it('should create money with custom currency', () => {
      const money = Money.create(50000, 'USD')

      expect(money.amount).toBe(50000)
      expect(money.currency).toBe('USD')
      expect(money.majorAmount).toBe(500)
    })

    it('should normalize currency to uppercase', () => {
      const money = Money.create(1000, 'usd')

      expect(money.currency).toBe('USD')
    })

    it('should throw error for negative amount', () => {
      expect(() => Money.create(-100)).toThrow('Amount cannot be negative')
    })

    it('should allow zero amount', () => {
      const money = Money.create(0)

      expect(money.amount).toBe(0)
    })

    it('should throw error for empty currency', () => {
      expect(() => Money.create(100, '')).toThrow('Currency cannot be empty')
    })

    it('should throw error for whitespace-only currency', () => {
      expect(() => Money.create(100, '   ')).toThrow('Currency cannot be empty')
    })
  })

  describe('add', () => {
    it('should add two money values with same currency', () => {
      const money1 = Money.create(10000)
      const money2 = Money.create(5000)

      const result = money1.add(money2)

      expect(result.amount).toBe(15000)
      expect(result.currency).toBe('BRL')
    })

    it('should throw error when adding different currencies', () => {
      const money1 = Money.create(10000, 'BRL')
      const money2 = Money.create(5000, 'USD')

      expect(() => money1.add(money2)).toThrow('Cannot add different currencies: BRL and USD')
    })
  })

  describe('subtract', () => {
    it('should subtract two money values with same currency', () => {
      const money1 = Money.create(10000)
      const money2 = Money.create(3000)

      const result = money1.subtract(money2)

      expect(result.amount).toBe(7000)
      expect(result.currency).toBe('BRL')
    })

    it('should throw error when subtracting different currencies', () => {
      const money1 = Money.create(10000, 'BRL')
      const money2 = Money.create(3000, 'USD')

      expect(() => money1.subtract(money2)).toThrow('Cannot subtract different currencies: BRL and USD')
    })

    it('should throw error when result is negative', () => {
      const money1 = Money.create(5000)
      const money2 = Money.create(10000)

      expect(() => money1.subtract(money2)).toThrow('Subtraction result cannot be negative')
    })

    it('should allow subtraction resulting in zero', () => {
      const money1 = Money.create(5000)
      const money2 = Money.create(5000)

      const result = money1.subtract(money2)

      expect(result.amount).toBe(0)
    })
  })

  describe('multiply', () => {
    it('should multiply money by positive factor', () => {
      const money = Money.create(10000)

      const result = money.multiply(2.5)

      expect(result.amount).toBe(25000)
      expect(result.currency).toBe('BRL')
    })

    it('should round multiplication result', () => {
      const money = Money.create(10000)

      const result = money.multiply(1.234)

      expect(result.amount).toBe(12340)
    })

    it('should throw error for negative factor', () => {
      const money = Money.create(10000)

      expect(() => money.multiply(-2)).toThrow('Factor cannot be negative')
    })

    it('should allow multiplication by zero', () => {
      const money = Money.create(10000)

      const result = money.multiply(0)

      expect(result.amount).toBe(0)
    })
  })

  describe('equals', () => {
    it('should return true for equal money values', () => {
      const money1 = Money.create(10000, 'BRL')
      const money2 = Money.create(10000, 'BRL')

      expect(money1.equals(money2)).toBe(true)
    })

    it('should return false for different amounts', () => {
      const money1 = Money.create(10000)
      const money2 = Money.create(5000)

      expect(money1.equals(money2)).toBe(false)
    })

    it('should return false for different currencies', () => {
      const money1 = Money.create(10000, 'BRL')
      const money2 = Money.create(10000, 'USD')

      expect(money1.equals(money2)).toBe(false)
    })
  })

  describe('isGreaterThan', () => {
    it('should return true when amount is greater', () => {
      const money1 = Money.create(10000)
      const money2 = Money.create(5000)

      expect(money1.isGreaterThan(money2)).toBe(true)
    })

    it('should return false when amount is less', () => {
      const money1 = Money.create(5000)
      const money2 = Money.create(10000)

      expect(money1.isGreaterThan(money2)).toBe(false)
    })

    it('should return false when amounts are equal', () => {
      const money1 = Money.create(10000)
      const money2 = Money.create(10000)

      expect(money1.isGreaterThan(money2)).toBe(false)
    })

    it('should throw error when comparing different currencies', () => {
      const money1 = Money.create(10000, 'BRL')
      const money2 = Money.create(5000, 'USD')

      expect(() => money1.isGreaterThan(money2)).toThrow('Cannot compare different currencies: BRL and USD')
    })
  })

  describe('isLessThan', () => {
    it('should return true when amount is less', () => {
      const money1 = Money.create(5000)
      const money2 = Money.create(10000)

      expect(money1.isLessThan(money2)).toBe(true)
    })

    it('should return false when amount is greater', () => {
      const money1 = Money.create(10000)
      const money2 = Money.create(5000)

      expect(money1.isLessThan(money2)).toBe(false)
    })

    it('should return false when amounts are equal', () => {
      const money1 = Money.create(10000)
      const money2 = Money.create(10000)

      expect(money1.isLessThan(money2)).toBe(false)
    })

    it('should throw error when comparing different currencies', () => {
      const money1 = Money.create(10000, 'BRL')
      const money2 = Money.create(5000, 'USD')

      expect(() => money1.isLessThan(money2)).toThrow('Cannot compare different currencies: BRL and USD')
    })
  })

  describe('toString', () => {
    it('should return formatted string', () => {
      const money = Money.create(10000)

      expect(money.toString()).toBe('BRL 100.00')
    })

    it('should handle decimal amounts', () => {
      const money = Money.create(12345)

      expect(money.toString()).toBe('BRL 123.45')
    })
  })

  describe('format', () => {
    it('should return locale-formatted string', () => {
      const money = Money.create(10000)

      const formatted = money.format()

      expect(formatted).toContain('100')
    })
  })
})

/**
 * Money value object
 * Encapsulates monetary amounts with currency
 */
export class Money {
  private readonly _amount: number
  private readonly _currency: string

  private constructor(amount: number, currency: string) {
    this._amount = amount
    this._currency = currency
  }

  /**
   * Create a Money value object
   * @param amount - Amount in minor units (e.g., cents for BRL)
   * @param currency - ISO 4217 currency code (default: BRL)
   * @returns Money instance
   * @throws Error if amount is negative
   */
  public static create(amount: number, currency: string = 'BRL'): Money {
    if (amount < 0) {
      throw new Error('Amount cannot be negative')
    }

    if (!currency || currency.trim() === '') {
      throw new Error('Currency cannot be empty')
    }

    return new Money(amount, currency.toUpperCase())
  }

  /**
   * Get amount in minor units (cents)
   */
  get amount(): number {
    return this._amount
  }

  /**
   * Get currency code
   */
  get currency(): string {
    return this._currency
  }

  /**
   * Get amount in major units (e.g., reais)
   */
  get majorAmount(): number {
    return this._amount / 100
  }

  /**
   * Add two money values
   * @param other - Money to add
   * @returns New Money instance with sum
   * @throws Error if currencies don't match
   */
  add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot add different currencies: ${this._currency} and ${other._currency}`)
    }

    return new Money(this._amount + other._amount, this._currency)
  }

  /**
   * Subtract money value
   * @param other - Money to subtract
   * @returns New Money instance with difference
   * @throws Error if currencies don't match or result is negative
   */
  subtract(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot subtract different currencies: ${this._currency} and ${other._currency}`)
    }

    const result = this._amount - other._amount
    if (result < 0) {
      throw new Error('Subtraction result cannot be negative')
    }

    return new Money(result, this._currency)
  }

  /**
   * Multiply by a factor
   * @param factor - Multiplication factor
   * @returns New Money instance
   */
  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Factor cannot be negative')
    }

    return new Money(Math.round(this._amount * factor), this._currency)
  }

  /**
   * Check equality with another money value
   * @param other - Money to compare
   * @returns True if amounts and currencies are equal
   */
  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency
  }

  /**
   * Check if this money is greater than another
   * @param other - Money to compare
   * @returns True if this is greater
   * @throws Error if currencies don't match
   */
  isGreaterThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot compare different currencies: ${this._currency} and ${other._currency}`)
    }

    return this._amount > other._amount
  }

  /**
   * Check if this money is less than another
   * @param other - Money to compare
   * @returns True if this is less
   * @throws Error if currencies don't match
   */
  isLessThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot compare different currencies: ${this._currency} and ${other._currency}`)
    }

    return this._amount < other._amount
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this._currency} ${this.majorAmount.toFixed(2)}`
  }

  /**
   * Format for display
   */
  format(): string {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this._currency,
    })
    return formatter.format(this.majorAmount)
  }
}

import { Payment } from '../entities'
import { PaymentStatus } from '@shared/value-objects'

/**
 * Payment repository interface
 * Defines contract for payment persistence
 */
export interface IPaymentRepository {
  /**
   * Create a new payment
   */
  create(payment: Payment): Promise<Payment>

  /**
   * Find payment by ID
   */
  findById(id: string): Promise<Payment | null>

  /**
   * Find payment by budget ID
   */
  findByBudgetId(budgetId: string): Promise<Payment | null>

  /**
   * Find payment by Mercado Pago payment ID
   */
  findByMercadoPagoId(mercadoPagoId: string): Promise<Payment | null>

  /**
   * Update an existing payment
   */
  update(payment: Payment): Promise<Payment>

  /**
   * Find payments by status
   */
  findByStatus(status: PaymentStatus): Promise<Payment[]>

  /**
   * List all payments with optional filters
   */
  findAll(filters?: {
    budgetId?: string
    status?: PaymentStatus
    limit?: number
    offset?: number
  }): Promise<{ payments: Payment[]; total: number }>
}

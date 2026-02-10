import { Budget } from '../entities'
import { BudgetStatus } from '@shared/value-objects'

/**
 * Budget repository interface
 * Defines contract for budget persistence
 */
export interface IBudgetRepository {
  /**
   * Create a new budget
   */
  create(budget: Budget): Promise<Budget>

  /**
   * Find budget by ID
   */
  findById(id: string): Promise<Budget | null>

  /**
   * Find budget by service order ID
   */
  findByServiceOrderId(serviceOrderId: string): Promise<Budget | null>

  /**
   * Update an existing budget
   */
  update(budget: Budget): Promise<Budget>

  /**
   * Find budgets by status
   */
  findByStatus(status: BudgetStatus): Promise<Budget[]>

  /**
   * List all budgets with optional filters
   */
  findAll(filters?: {
    serviceOrderId?: string
    status?: BudgetStatus
    limit?: number
    offset?: number
  }): Promise<{ budgets: Budget[]; total: number }>

  /**
   * Delete a budget
   */
  delete(id: string): Promise<void>
}

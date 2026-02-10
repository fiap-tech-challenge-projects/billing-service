import { Budget } from '../entities/budget.entity'
import { BudgetStatus } from '@shared/value-objects'

/**
 * Budget repository interface
 * Defines operations for persisting and retrieving budgets
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
   * Find all budgets with optional filters
   */
  findAll(filters?: {
    serviceOrderId?: string
    status?: BudgetStatus
    fromDate?: Date
    toDate?: Date
  }): Promise<Budget[]>

  /**
   * Update budget
   */
  update(id: string, budget: Budget): Promise<Budget>

  /**
   * Delete budget
   */
  delete(id: string): Promise<void>
}

export const BUDGET_REPOSITORY = Symbol('BUDGET_REPOSITORY')

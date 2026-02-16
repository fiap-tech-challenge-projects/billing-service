import { Injectable } from '@nestjs/common'
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { Budget, BudgetItem } from '@domain/budgets/entities'
import { IBudgetRepository } from '@domain/budgets/repositories'
import { Money, BudgetStatus } from '@shared/value-objects'

/**
 * DynamoDB implementation of budget repository
 * Table key: budgetId (HASH) + version (RANGE)
 * GSI: ServiceOrderIndex (serviceOrderId), StatusIndex (status + budgetId)
 */
@Injectable()
export class DynamoDBBudgetRepository implements IBudgetRepository {
  private readonly tableName: string

  constructor(private readonly dynamoClient: DynamoDBClient) {
    this.tableName = process.env.DYNAMODB_BUDGETS_TABLE || 'fiap-budgets-dev'
  }

  async create(budget: Budget): Promise<Budget> {
    const budgetId = crypto.randomUUID()
    const now = new Date()

    const item = {
      budgetId,
      version: Date.now(),
      serviceOrderId: budget.serviceOrderId,
      totalAmountInCents: budget.totalAmount.amount,
      currency: budget.totalAmount.currency,
      status: budget.status,
      items: budget.items.map((item) => ({
        id: crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        unitPriceInCents: item.unitPrice.amount,
        totalPriceInCents: item.totalPrice.amount,
        currency: item.unitPrice.currency,
      })),
      approvedAt: budget.approvedAt?.toISOString(),
      rejectedAt: budget.rejectedAt?.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    await this.dynamoClient.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(item, { removeUndefinedValues: true }),
      }),
    )

    return this.mapToDomain({
      ...item,
      createdAt: now,
      updatedAt: now,
    })
  }

  async findById(id: string): Promise<Budget | null> {
    const result = await this.dynamoClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'budgetId = :id',
        ExpressionAttributeValues: {
          ':id': { S: id },
        },
        ScanIndexForward: false,
        Limit: 1,
      }),
    )

    if (!result.Items || result.Items.length === 0) {
      return null
    }

    return this.mapToDomain(unmarshall(result.Items[0]))
  }

  async findByServiceOrderId(serviceOrderId: string): Promise<Budget | null> {
    const result = await this.dynamoClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'ServiceOrderIndex',
        KeyConditionExpression: 'serviceOrderId = :serviceOrderId',
        ExpressionAttributeValues: marshall({
          ':serviceOrderId': serviceOrderId,
        }),
        Limit: 1,
      }),
    )

    if (!result.Items || result.Items.length === 0) {
      return null
    }

    return this.mapToDomain(unmarshall(result.Items[0]))
  }

  async update(budget: Budget): Promise<Budget> {
    const now = new Date()

    // Find the version (sort key) for this budget
    const existing = await this.dynamoClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'budgetId = :id',
        ExpressionAttributeValues: {
          ':id': { S: budget.id },
        },
        ScanIndexForward: false,
        Limit: 1,
      }),
    )

    const version = existing.Items?.[0]
      ? unmarshall(existing.Items[0]).version
      : now.toISOString()

    const expressionParts: string[] = [
      '#status = :status',
      '#updatedAt = :updatedAt',
    ]
    const exprNames: Record<string, string> = {
      '#status': 'status',
      '#updatedAt': 'updatedAt',
    }
    const exprValues: Record<string, any> = {
      ':status': budget.status,
      ':updatedAt': now.toISOString(),
    }

    if (budget.approvedAt) {
      expressionParts.push('#approvedAt = :approvedAt')
      exprNames['#approvedAt'] = 'approvedAt'
      exprValues[':approvedAt'] = budget.approvedAt.toISOString()
    }

    if (budget.rejectedAt) {
      expressionParts.push('#rejectedAt = :rejectedAt')
      exprNames['#rejectedAt'] = 'rejectedAt'
      exprValues[':rejectedAt'] = budget.rejectedAt.toISOString()
    }

    await this.dynamoClient.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ budgetId: budget.id, version }),
        UpdateExpression: 'SET ' + expressionParts.join(', '),
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: marshall(exprValues),
      }),
    )

    return this.findById(budget.id) as Promise<Budget>
  }

  async findByStatus(status: BudgetStatus): Promise<Budget[]> {
    const result = await this.dynamoClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
          ':status': status,
        }),
      }),
    )

    if (!result.Items) {
      return []
    }

    return result.Items.map((item) => this.mapToDomain(unmarshall(item)))
  }

  async findAll(filters?: {
    serviceOrderId?: string
    status?: BudgetStatus
    limit?: number
    offset?: number
  }): Promise<{ budgets: Budget[]; total: number }> {
    // If filtering by serviceOrderId, use the GSI
    if (filters?.serviceOrderId) {
      const result = await this.dynamoClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'ServiceOrderIndex',
          KeyConditionExpression: 'serviceOrderId = :serviceOrderId',
          ExpressionAttributeValues: marshall({
            ':serviceOrderId': filters.serviceOrderId,
          }),
          Limit: filters?.limit || 100,
        }),
      )

      const budgets = result.Items
        ? result.Items.map((item) => this.mapToDomain(unmarshall(item)))
        : []

      return { budgets, total: budgets.length }
    }

    let filterExpression: string | undefined
    let expressionAttributeNames: Record<string, string> | undefined
    let expressionAttributeValues: any

    if (filters?.status) {
      filterExpression = '#status = :status'
      expressionAttributeNames = { '#status': 'status' }
      expressionAttributeValues = { ':status': filters.status }
    }

    const result = await this.dynamoClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
          ? marshall(expressionAttributeValues)
          : undefined,
        Limit: filters?.limit || 100,
      }),
    )

    const budgets = result.Items
      ? result.Items.map((item) => this.mapToDomain(unmarshall(item)))
      : []

    return {
      budgets,
      total: budgets.length,
    }
  }

  async delete(id: string): Promise<void> {
    // Find the version first
    const existing = await this.dynamoClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'budgetId = :id',
        ExpressionAttributeValues: {
          ':id': { S: id },
        },
        ScanIndexForward: false,
        Limit: 1,
      }),
    )

    if (!existing.Items || existing.Items.length === 0) return

    const version = unmarshall(existing.Items[0]).version

    await this.dynamoClient.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({ budgetId: id, version }),
      }),
    )
  }

  private mapToDomain(data: any): Budget {
    const totalAmount = Money.create(data.totalAmountInCents, data.currency)

    const items = (data.items || []).map(
      (item: any) =>
        new BudgetItem(
          item.id,
          item.description,
          item.quantity,
          Money.create(item.unitPriceInCents, item.currency),
        ),
    )

    return new Budget(
      data.budgetId,
      data.serviceOrderId,
      totalAmount,
      data.status as BudgetStatus,
      items,
      data.approvedAt ? new Date(data.approvedAt) : undefined,
      data.rejectedAt ? new Date(data.rejectedAt) : undefined,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    )
  }
}

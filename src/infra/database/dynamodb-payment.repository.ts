import { Injectable } from '@nestjs/common'
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { Payment } from '@domain/payments/entities'
import { IPaymentRepository } from '@domain/payments/repositories'
import { Money, PaymentStatus } from '@shared/value-objects'

/**
 * DynamoDB implementation of payment repository
 */
@Injectable()
export class DynamoDBPaymentRepository implements IPaymentRepository {
  private readonly tableName: string

  constructor(private readonly dynamoClient: DynamoDBClient) {
    this.tableName = process.env.DYNAMODB_PAYMENTS_TABLE || 'fiap-payments-dev'
  }

  async create(payment: Payment): Promise<Payment> {
    const id = crypto.randomUUID()
    const now = new Date()

    const item = {
      id,
      budgetId: payment.budgetId,
      amountInCents: payment.amount.amountInCents,
      currency: payment.amount.currency,
      status: payment.status,
      mercadoPagoPaymentId: payment.mercadoPagoPaymentId,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      completedAt: payment.completedAt?.toISOString(),
      failedAt: payment.failedAt?.toISOString(),
      refundedAt: payment.refundedAt?.toISOString(),
      failureReason: payment.failureReason,
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

  async findById(id: string): Promise<Payment | null> {
    const result = await this.dynamoClient.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ id }),
      }),
    )

    if (!result.Item) {
      return null
    }

    return this.mapToDomain(unmarshall(result.Item))
  }

  async findByBudgetId(budgetId: string): Promise<Payment | null> {
    const result = await this.dynamoClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'BudgetIndex',
        KeyConditionExpression: 'budgetId = :budgetId',
        ExpressionAttributeValues: marshall({
          ':budgetId': budgetId,
        }),
        Limit: 1,
      }),
    )

    if (!result.Items || result.Items.length === 0) {
      return null
    }

    return this.mapToDomain(unmarshall(result.Items[0]))
  }

  async findByMercadoPagoId(mercadoPagoId: string): Promise<Payment | null> {
    const result = await this.dynamoClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'MercadoPagoIndex',
        KeyConditionExpression: 'mercadoPagoPaymentId = :mercadoPagoId',
        ExpressionAttributeValues: marshall({
          ':mercadoPagoId': mercadoPagoId,
        }),
        Limit: 1,
      }),
    )

    if (!result.Items || result.Items.length === 0) {
      return null
    }

    return this.mapToDomain(unmarshall(result.Items[0]))
  }

  async update(payment: Payment): Promise<Payment> {
    const now = new Date()

    await this.dynamoClient.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ id: payment.id }),
        UpdateExpression:
          'SET #status = :status, #updatedAt = :updatedAt, #mercadoPagoPaymentId = :mercadoPagoPaymentId, ' +
          '#qrCode = :qrCode, #qrCodeBase64 = :qrCodeBase64, #completedAt = :completedAt, ' +
          '#failedAt = :failedAt, #refundedAt = :refundedAt, #failureReason = :failureReason',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
          '#mercadoPagoPaymentId': 'mercadoPagoPaymentId',
          '#qrCode': 'qrCode',
          '#qrCodeBase64': 'qrCodeBase64',
          '#completedAt': 'completedAt',
          '#failedAt': 'failedAt',
          '#refundedAt': 'refundedAt',
          '#failureReason': 'failureReason',
        },
        ExpressionAttributeValues: marshall({
          ':status': payment.status,
          ':updatedAt': now.toISOString(),
          ':mercadoPagoPaymentId': payment.mercadoPagoPaymentId,
          ':qrCode': payment.qrCode,
          ':qrCodeBase64': payment.qrCodeBase64,
          ':completedAt': payment.completedAt?.toISOString(),
          ':failedAt': payment.failedAt?.toISOString(),
          ':refundedAt': payment.refundedAt?.toISOString(),
          ':failureReason': payment.failureReason,
        }, { removeUndefinedValues: true }),
      }),
    )

    return this.findById(payment.id) as Promise<Payment>
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    const result = await this.dynamoClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: '#status = :status',
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
    budgetId?: string
    status?: PaymentStatus
    limit?: number
    offset?: number
  }): Promise<{ payments: Payment[]; total: number }> {
    let filterExpression: string | undefined
    let expressionAttributeNames: Record<string, string> | undefined
    let expressionAttributeValues: any

    if (filters?.budgetId || filters?.status) {
      const conditions: string[] = []
      expressionAttributeNames = {}
      expressionAttributeValues = {}

      if (filters.budgetId) {
        conditions.push('#budgetId = :budgetId')
        expressionAttributeNames['#budgetId'] = 'budgetId'
        expressionAttributeValues[':budgetId'] = filters.budgetId
      }

      if (filters.status) {
        conditions.push('#status = :status')
        expressionAttributeNames['#status'] = 'status'
        expressionAttributeValues[':status'] = filters.status
      }

      filterExpression = conditions.join(' AND ')
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

    const payments = result.Items
      ? result.Items.map((item) => this.mapToDomain(unmarshall(item)))
      : []

    return {
      payments,
      total: payments.length,
    }
  }

  private mapToDomain(data: any): Payment {
    const amount = Money.create(data.amountInCents, data.currency)

    return new Payment(
      data.id,
      data.budgetId,
      amount,
      data.status as PaymentStatus,
      data.mercadoPagoPaymentId,
      data.qrCode,
      data.qrCodeBase64,
      data.completedAt ? new Date(data.completedAt) : undefined,
      data.failedAt ? new Date(data.failedAt) : undefined,
      data.refundedAt ? new Date(data.refundedAt) : undefined,
      data.failureReason,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    )
  }
}

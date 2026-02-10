import { Injectable, Logger } from '@nestjs/common'
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge'
import { IEventPublisher } from '@application/events/interfaces/event-publisher.interface'

/**
 * EventBridge implementation of event publisher
 */
@Injectable()
export class EventBridgeEventPublisherService implements IEventPublisher {
  private readonly logger = new Logger(EventBridgeEventPublisherService.name)
  private readonly eventBridge: EventBridgeClient
  private readonly eventBusName: string

  constructor() {
    const endpoint = process.env.EVENTBRIDGE_ENDPOINT
    this.eventBridge = new EventBridgeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      ...(endpoint && { endpoint }),
    })
    this.eventBusName =
      process.env.EVENT_BUS_NAME || 'fiap-tech-challenge-event-bus'
  }

  async publishBudgetGenerated(data: {
    budgetId: string
    serviceOrderId: string
    totalAmountInCents: number
    currency: string
  }): Promise<void> {
    await this.publishEvent('BudgetGenerated', 'billing.budget', data)
  }

  async publishBudgetApproved(data: {
    budgetId: string
    serviceOrderId: string
    approvedAt: Date
  }): Promise<void> {
    await this.publishEvent('BudgetApproved', 'billing.budget', data)
  }

  async publishBudgetRejected(data: {
    budgetId: string
    serviceOrderId: string
    reason: string
    rejectedAt: Date
  }): Promise<void> {
    await this.publishEvent('BudgetRejected', 'billing.budget', data)
  }

  async publishPaymentInitiated(data: {
    paymentId: string
    budgetId: string
    amountInCents: number
    currency: string
  }): Promise<void> {
    await this.publishEvent('PaymentInitiated', 'billing.payment', data)
  }

  async publishPaymentCompleted(data: {
    paymentId: string
    budgetId: string
    serviceOrderId: string
    completedAt: Date
  }): Promise<void> {
    await this.publishEvent('PaymentCompleted', 'billing.payment', data)
  }

  async publishPaymentFailed(data: {
    paymentId: string
    budgetId: string
    reason: string
    failedAt: Date
  }): Promise<void> {
    await this.publishEvent('PaymentFailed', 'billing.payment', data)
  }

  private async publishEvent(
    detailType: string,
    source: string,
    detail: any,
  ): Promise<void> {
    try {
      const command = new PutEventsCommand({
        Entries: [
          {
            EventBusName: this.eventBusName,
            Source: source,
            DetailType: detailType,
            Detail: JSON.stringify(detail),
            Time: new Date(),
          },
        ],
      })

      const response = await this.eventBridge.send(command)

      if (response.FailedEntryCount && response.FailedEntryCount > 0) {
        this.logger.error(
          `Failed to publish ${detailType} event`,
          response.Entries,
        )
        throw new Error(`Failed to publish ${detailType} event`)
      }

      this.logger.log(`Published ${detailType} event`)
    } catch (error) {
      this.logger.error(`Error publishing ${detailType} event`, error)
      throw error
    }
  }
}

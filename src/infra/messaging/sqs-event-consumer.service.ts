import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs'
import { CreateBudgetUseCase } from '@application/budgets/use-cases'

@Injectable()
export class SqsEventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsEventConsumerService.name)
  private readonly sqs: SQSClient
  private readonly queueUrl: string
  private polling = false

  constructor(private readonly createBudgetUseCase: CreateBudgetUseCase) {
    this.sqs = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    })
    this.queueUrl = process.env.SQS_QUEUE_URL || ''
  }

  onModuleInit() {
    if (!this.queueUrl) {
      this.logger.warn('SQS_QUEUE_URL not configured, event consumer disabled')
      return
    }
    this.polling = true
    this.logger.log(`Starting SQS consumer for queue: ${this.queueUrl}`)
    this.poll()
  }

  onModuleDestroy() {
    this.polling = false
    this.logger.log('Stopping SQS consumer')
  }

  private async poll(): Promise<void> {
    while (this.polling) {
      try {
        const result = await this.sqs.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
            MessageAttributeNames: ['All'],
          }),
        )

        if (result.Messages && result.Messages.length > 0) {
          for (const message of result.Messages) {
            try {
              await this.handleMessage(message)
              await this.sqs.send(
                new DeleteMessageCommand({
                  QueueUrl: this.queueUrl,
                  ReceiptHandle: message.ReceiptHandle,
                }),
              )
            } catch (error) {
              this.logger.error(
                `Error processing message ${message.MessageId}`,
                error,
              )
            }
          }
        }
      } catch (error) {
        if (this.polling) {
          this.logger.error('Error polling SQS', error)
          await this.sleep(5000)
        }
      }
    }
  }

  private async handleMessage(message: any): Promise<void> {
    const body = JSON.parse(message.Body)

    // EventBridge wraps events in an envelope
    const detailType = body['detail-type'] || body.DetailType
    const detail = body.detail || body.Detail

    this.logger.log(`Received event: ${detailType}`)

    switch (detailType) {
      case 'OrderCreated':
        await this.handleOrderCreated(
          typeof detail === 'string' ? JSON.parse(detail) : detail,
        )
        break
      default:
        this.logger.log(`Ignoring event type: ${detailType}`)
    }
  }

  private async handleOrderCreated(detail: {
    orderId: string
    clientId: string
    vehicleId: string
    status: string
    requestDate: string
  }): Promise<void> {
    this.logger.log(
      `Processing OrderCreated for order ${detail.orderId}`,
    )

    try {
      await this.createBudgetUseCase.execute({
        serviceOrderId: detail.orderId,
        items: [
          {
            description: 'Service inspection and diagnostics',
            quantity: 1,
            unitPriceInCents: 15000,
            currency: 'BRL',
          },
        ],
      })
      this.logger.log(
        `Budget auto-generated for order ${detail.orderId}`,
      )
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('already exists')
      ) {
        this.logger.warn(
          `Budget already exists for order ${detail.orderId}, skipping`,
        )
      } else {
        throw error
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

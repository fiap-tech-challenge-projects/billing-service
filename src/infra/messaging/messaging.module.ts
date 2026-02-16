import { Module, forwardRef } from '@nestjs/common'
import { EventBridgeEventPublisherService } from './eventbridge-event-publisher.service'
import { SqsEventConsumerService } from './sqs-event-consumer.service'
import { BudgetsModule } from '@application/budgets/budgets.module'

@Module({
  imports: [forwardRef(() => BudgetsModule)],
  providers: [
    {
      provide: 'IEventPublisher',
      useClass: EventBridgeEventPublisherService,
    },
    SqsEventConsumerService,
  ],
  exports: ['IEventPublisher'],
})
export class MessagingModule {}

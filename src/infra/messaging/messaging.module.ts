import { Module } from '@nestjs/common'
import { EventBridgeEventPublisherService } from './eventbridge-event-publisher.service'

@Module({
  providers: [
    {
      provide: 'IEventPublisher',
      useClass: EventBridgeEventPublisherService,
    },
  ],
  exports: ['IEventPublisher'],
})
export class MessagingModule {}

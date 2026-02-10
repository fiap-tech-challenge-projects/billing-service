import { Module } from '@nestjs/common'
import { DatabaseModule } from '@infra/database/database.module'
import { MessagingModule } from '@infra/messaging/messaging.module'
import { PaymentModule } from '@infra/payment/payment.module'
import {
  CreatePaymentUseCase,
  GetPaymentUseCase,
  GetPaymentQrCodeUseCase,
  ProcessWebhookUseCase,
} from './use-cases'

@Module({
  imports: [DatabaseModule, MessagingModule, PaymentModule],
  providers: [
    CreatePaymentUseCase,
    GetPaymentUseCase,
    GetPaymentQrCodeUseCase,
    ProcessWebhookUseCase,
  ],
  exports: [
    CreatePaymentUseCase,
    GetPaymentUseCase,
    GetPaymentQrCodeUseCase,
    ProcessWebhookUseCase,
  ],
})
export class PaymentsModule {}

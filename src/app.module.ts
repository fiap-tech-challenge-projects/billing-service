import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BudgetsModule } from '@application/budgets/budgets.module'
import { PaymentsModule } from '@application/payments/payments.module'
import { BudgetsController } from '@interfaces/rest/controllers/budgets.controller'
import { PaymentsController } from '@interfaces/rest/controllers/payments.controller'
import { HealthController } from '@interfaces/rest/controllers/health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BudgetsModule,
    PaymentsModule,
  ],
  controllers: [BudgetsController, PaymentsController, HealthController],
})
export class AppModule {}

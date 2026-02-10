import { Module } from '@nestjs/common'
import { DatabaseModule } from '@infra/database/database.module'
import { MessagingModule } from '@infra/messaging/messaging.module'
import {
  CreateBudgetUseCase,
  ApproveBudgetUseCase,
  RejectBudgetUseCase,
  GetBudgetUseCase,
  ListBudgetsUseCase,
} from './use-cases'

@Module({
  imports: [DatabaseModule, MessagingModule],
  providers: [
    CreateBudgetUseCase,
    ApproveBudgetUseCase,
    RejectBudgetUseCase,
    GetBudgetUseCase,
    ListBudgetsUseCase,
  ],
  exports: [
    CreateBudgetUseCase,
    ApproveBudgetUseCase,
    RejectBudgetUseCase,
    GetBudgetUseCase,
    ListBudgetsUseCase,
  ],
})
export class BudgetsModule {}

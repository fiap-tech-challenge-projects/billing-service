import { Module, forwardRef } from '@nestjs/common'
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
  imports: [DatabaseModule, forwardRef(() => MessagingModule)],
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

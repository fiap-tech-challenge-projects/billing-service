import { Module } from '@nestjs/common'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBBudgetRepository } from './dynamodb-budget.repository'
import { DynamoDBPaymentRepository } from './dynamodb-payment.repository'

@Module({
  providers: [
    {
      provide: 'DynamoDBClient',
      useFactory: () => {
        const endpoint = process.env.DYNAMODB_ENDPOINT
        return new DynamoDBClient({
          region: process.env.AWS_REGION || 'us-east-1',
          ...(endpoint && { endpoint }),
        })
      },
    },
    {
      provide: 'IBudgetRepository',
      useFactory: (dynamoClient: DynamoDBClient) =>
        new DynamoDBBudgetRepository(dynamoClient),
      inject: ['DynamoDBClient'],
    },
    {
      provide: 'IPaymentRepository',
      useFactory: (dynamoClient: DynamoDBClient) =>
        new DynamoDBPaymentRepository(dynamoClient),
      inject: ['DynamoDBClient'],
    },
  ],
  exports: ['IBudgetRepository', 'IPaymentRepository'],
})
export class DatabaseModule {}

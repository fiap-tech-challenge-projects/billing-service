import { IsString, IsNotEmpty } from 'class-validator'

/**
 * DTO for creating a payment
 */
export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  budgetId: string
}

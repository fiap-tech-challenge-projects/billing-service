import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for creating a budget
 */
export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  serviceOrderId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetItemDto)
  items: CreateBudgetItemDto[]
}

export class CreateBudgetItemDto {
  @IsString()
  @IsNotEmpty()
  description: string

  @IsNumber()
  quantity: number

  @IsNumber()
  unitPriceInCents: number

  @IsString()
  @IsOptional()
  currency?: string
}

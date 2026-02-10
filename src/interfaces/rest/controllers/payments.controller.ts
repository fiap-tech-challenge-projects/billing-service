import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger'
import {
  CreatePaymentUseCase,
  GetPaymentUseCase,
  GetPaymentQrCodeUseCase,
  ProcessWebhookUseCase,
} from '@application/payments/use-cases'
import {
  CreatePaymentDto,
  PaymentResponseDto,
  QrCodeResponseDto,
} from '@application/payments/dtos'

@ApiTags('Payments')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly getPaymentUseCase: GetPaymentUseCase,
    private readonly getPaymentQrCodeUseCase: GetPaymentQrCodeUseCase,
    private readonly processWebhookUseCase: ProcessWebhookUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment created successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.createPaymentUseCase.execute(createPaymentDto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment found',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async findOne(@Param('id') id: string): Promise<PaymentResponseDto> {
    return this.getPaymentUseCase.execute(id)
  }

  @Get(':id/qr-code')
  @ApiOperation({ summary: 'Get payment QR code' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'QR code retrieved',
    type: QrCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async getQrCode(@Param('id') id: string): Promise<QrCodeResponseDto> {
    return this.getPaymentQrCodeUseCase.execute(id)
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mercado Pago webhook endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  async webhook(@Body() body: any): Promise<{ success: boolean }> {
    await this.processWebhookUseCase.execute(body)
    return { success: true }
  }
}

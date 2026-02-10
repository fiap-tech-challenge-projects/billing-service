import { Module } from '@nestjs/common'
import { MercadoPagoService } from './mercado-pago.service'

@Module({
  providers: [
    {
      provide: 'IMercadoPagoService',
      useClass: MercadoPagoService,
    },
  ],
  exports: ['IMercadoPagoService'],
})
export class PaymentModule {}

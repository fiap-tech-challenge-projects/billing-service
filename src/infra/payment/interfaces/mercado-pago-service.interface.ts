/**
 * Mercado Pago service interface
 */
export interface IMercadoPagoService {
  /**
   * Create a payment in Mercado Pago
   */
  createPayment(data: {
    transactionAmount: number
    description: string
    externalReference: string
  }): Promise<MercadoPagoPaymentResponse>

  /**
   * Get payment details from Mercado Pago
   */
  getPayment(paymentId: string): Promise<MercadoPagoPaymentResponse>

  /**
   * Refund a payment
   */
  refundPayment(paymentId: string): Promise<void>
}

export interface MercadoPagoPaymentResponse {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  statusDetail?: string
  qrCode: string
  qrCodeBase64: string
}

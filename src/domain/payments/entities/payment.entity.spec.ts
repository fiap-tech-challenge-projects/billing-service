import { Payment } from './payment.entity'
import { Money, PaymentStatus } from '@shared/value-objects'
import { InvalidPaymentStatusTransitionException } from '../exceptions'

describe('Payment Entity', () => {
  const budgetId = 'budget-123'
  const amount = Money.create(10000) // R$ 100.00

  describe('create', () => {
    it('should create payment with PENDING status', () => {
      const payment = Payment.create(budgetId, amount)

      expect(payment).toBeInstanceOf(Payment)
      expect(payment.budgetId).toBe(budgetId)
      expect(payment.amount).toEqual(amount)
      expect(payment.status).toBe(PaymentStatus.PENDING)
      expect(payment.mercadoPagoPaymentId).toBeUndefined()
      expect(payment.qrCode).toBeUndefined()
      expect(payment.qrCodeBase64).toBeUndefined()
      expect(payment.completedAt).toBeUndefined()
      expect(payment.failedAt).toBeUndefined()
      expect(payment.refundedAt).toBeUndefined()
      expect(payment.failureReason).toBeUndefined()
    })

    it('should create payment with empty id', () => {
      const payment = Payment.create(budgetId, amount)

      expect(payment.id).toBe('')
    })

    it('should throw error when budget ID is empty', () => {
      expect(() => {
        Payment.create('', amount)
      }).toThrow('Budget ID is required')
    })

    it('should throw error when budget ID is whitespace', () => {
      expect(() => {
        Payment.create('   ', amount)
      }).toThrow('Budget ID is required')
    })

    it('should throw error when amount is zero', () => {
      expect(() => {
        Payment.create(budgetId, Money.create(0))
      }).toThrow('Payment amount must be positive')
    })

    it('should throw error when amount is negative', () => {
      expect(() => {
        Payment.create(budgetId, Money.create(-1000))
      }).toThrow('Amount cannot be negative')
    })
  })

  describe('setMercadoPagoData', () => {
    it('should set Mercado Pago data and change status to PROCESSING', () => {
      const payment = Payment.create(budgetId, amount)
      const mercadoPagoId = 'mp-123'
      const qrCode = 'qr-code-data'
      const qrCodeBase64 = 'base64-data'

      payment.setMercadoPagoData(mercadoPagoId, qrCode, qrCodeBase64)

      expect(payment.mercadoPagoPaymentId).toBe(mercadoPagoId)
      expect(payment.qrCode).toBe(qrCode)
      expect(payment.qrCodeBase64).toBe(qrCodeBase64)
      expect(payment.status).toBe(PaymentStatus.PROCESSING)
    })

    it('should update updatedAt timestamp', async () => {
      const payment = Payment.create(budgetId, amount)
      const originalUpdatedAt = payment.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      payment.setMercadoPagoData('mp-123', 'qr', 'base64')

      expect(payment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error when payment is not pending', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')

      expect(() => {
        payment.setMercadoPagoData('mp-456', 'qr2', 'base64-2')
      }).toThrow('Can only set Mercado Pago data for pending payments')
    })
  })

  describe('complete', () => {
    it('should complete payment from PROCESSING status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')

      payment.complete()

      expect(payment.status).toBe(PaymentStatus.COMPLETED)
      expect(payment.completedAt).toBeInstanceOf(Date)
    })

    it('should update updatedAt timestamp', async () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      const originalUpdatedAt = payment.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      payment.complete()

      expect(payment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error when completing from PENDING status', () => {
      const payment = Payment.create(budgetId, amount)

      expect(() => {
        payment.complete()
      }).toThrow(InvalidPaymentStatusTransitionException)
    })

    it('should throw error when completing already completed payment', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()

      expect(() => {
        payment.complete()
      }).toThrow(InvalidPaymentStatusTransitionException)
    })
  })

  describe('fail', () => {
    it('should fail payment from PENDING status', () => {
      const payment = Payment.create(budgetId, amount)
      const reason = 'Insufficient funds'

      payment.fail(reason)

      expect(payment.status).toBe(PaymentStatus.FAILED)
      expect(payment.failedAt).toBeInstanceOf(Date)
      expect(payment.failureReason).toBe(reason)
    })

    it('should fail payment from PROCESSING status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      const reason = 'Payment rejected'

      payment.fail(reason)

      expect(payment.status).toBe(PaymentStatus.FAILED)
      expect(payment.failureReason).toBe(reason)
    })

    it('should update updatedAt timestamp', async () => {
      const payment = Payment.create(budgetId, amount)
      const originalUpdatedAt = payment.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      payment.fail('Error')

      expect(payment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error when failing already failed payment', () => {
      const payment = Payment.create(budgetId, amount)
      payment.fail('First error')

      expect(() => {
        payment.fail('Second error')
      }).toThrow(InvalidPaymentStatusTransitionException)
    })

    it('should throw error when failing completed payment', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()

      expect(() => {
        payment.fail('Error')
      }).toThrow(InvalidPaymentStatusTransitionException)
    })
  })

  describe('refund', () => {
    it('should refund completed payment', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()

      payment.refund()

      expect(payment.status).toBe(PaymentStatus.REFUNDED)
      expect(payment.refundedAt).toBeInstanceOf(Date)
    })

    it('should update updatedAt timestamp', async () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()
      const originalUpdatedAt = payment.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      payment.refund()

      expect(payment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error when refunding pending payment', () => {
      const payment = Payment.create(budgetId, amount)

      expect(() => {
        payment.refund()
      }).toThrow(InvalidPaymentStatusTransitionException)
    })

    it('should throw error when refunding processing payment', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')

      expect(() => {
        payment.refund()
      }).toThrow(InvalidPaymentStatusTransitionException)
    })

    it('should throw error when refunding failed payment', () => {
      const payment = Payment.create(budgetId, amount)
      payment.fail('Error')

      expect(() => {
        payment.refund()
      }).toThrow(InvalidPaymentStatusTransitionException)
    })

    it('should throw error when refunding already refunded payment', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()
      payment.refund()

      expect(() => {
        payment.refund()
      }).toThrow(InvalidPaymentStatusTransitionException)
    })
  })

  describe('isInFinalState', () => {
    it('should return false for PENDING status', () => {
      const payment = Payment.create(budgetId, amount)

      expect(payment.isInFinalState()).toBe(false)
    })

    it('should return false for PROCESSING status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')

      expect(payment.isInFinalState()).toBe(false)
    })

    it('should return true for COMPLETED status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()

      expect(payment.isInFinalState()).toBe(true)
    })

    it('should return true for FAILED status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.fail('Error')

      expect(payment.isInFinalState()).toBe(true)
    })

    it('should return true for REFUNDED status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()
      payment.refund()

      expect(payment.isInFinalState()).toBe(true)
    })
  })

  describe('canBeRefunded', () => {
    it('should return false for PENDING status', () => {
      const payment = Payment.create(budgetId, amount)

      expect(payment.canBeRefunded()).toBe(false)
    })

    it('should return false for PROCESSING status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')

      expect(payment.canBeRefunded()).toBe(false)
    })

    it('should return true for COMPLETED status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()

      expect(payment.canBeRefunded()).toBe(true)
    })

    it('should return false for FAILED status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.fail('Error')

      expect(payment.canBeRefunded()).toBe(false)
    })

    it('should return false for REFUNDED status', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()
      payment.refund()

      expect(payment.canBeRefunded()).toBe(false)
    })
  })

  describe('status transitions - valid', () => {
    it('should allow transition from PENDING to PROCESSING', () => {
      const payment = Payment.create(budgetId, amount)

      expect(() => payment.setMercadoPagoData('mp-123', 'qr', 'base64')).not.toThrow()
      expect(payment.status).toBe(PaymentStatus.PROCESSING)
    })

    it('should allow transition from PENDING to FAILED', () => {
      const payment = Payment.create(budgetId, amount)

      expect(() => payment.fail('Error')).not.toThrow()
      expect(payment.status).toBe(PaymentStatus.FAILED)
    })

    it('should allow transition from PROCESSING to COMPLETED', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')

      expect(() => payment.complete()).not.toThrow()
      expect(payment.status).toBe(PaymentStatus.COMPLETED)
    })

    it('should allow transition from PROCESSING to FAILED', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')

      expect(() => payment.fail('Error')).not.toThrow()
      expect(payment.status).toBe(PaymentStatus.FAILED)
    })

    it('should allow transition from COMPLETED to REFUNDED', () => {
      const payment = Payment.create(budgetId, amount)
      payment.setMercadoPagoData('mp-123', 'qr', 'base64')
      payment.complete()

      expect(() => payment.refund()).not.toThrow()
      expect(payment.status).toBe(PaymentStatus.REFUNDED)
    })
  })
})

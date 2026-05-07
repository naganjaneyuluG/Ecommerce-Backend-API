import Payment, { IPayment } from './payment.model';

export class PaymentRepository {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    return new Payment(data).save();
  }

  async findById(paymentId: string): Promise<IPayment | null> {
    return Payment.findById(paymentId).populate('order').exec();
  }

  async findByOrder(orderId: string): Promise<IPayment | null> {
    return Payment.findOne({ order: orderId }).exec();
  }

  async findByProviderPaymentId(providerPaymentId: string): Promise<IPayment | null> {
    return Payment.findOne({ providerPaymentId }).exec();
  }

  async findByProviderOrderId(providerOrderId: string): Promise<IPayment | null> {
    return Payment.findOne({ providerOrderId }).exec();
  }

  async update(paymentId: string, data: Partial<IPayment>): Promise<IPayment | null> {
    return Payment.findByIdAndUpdate(paymentId, data, { new: true }).exec();
  }

  async updateByProviderPaymentId(providerPaymentId: string, data: Partial<IPayment>): Promise<IPayment | null> {
    return Payment.findOneAndUpdate({ providerPaymentId }, data, { new: true }).exec();
  }
}

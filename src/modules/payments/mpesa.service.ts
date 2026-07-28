import axios from 'axios';
import { env } from '../../config/environment';
import { prisma } from '../../config/database';
import { TransactionStatus } from '../../shared/enums/transaction-types.enum';
import { MpesaPaymentDto } from './dto/mpesa.dto';

export class MpesaService {
  private static async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return response.data.access_token;
  }

  static async initiatePayment(userId: string, data: MpesaPaymentDto) {
    const accessToken = await this.getAccessToken();

    // Generate unique reference
    const reference = data.reference || `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Format phone number (remove leading 0 or +254)
    let phoneNumber = data.phoneNumber;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '254' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('+')) {
      phoneNumber = phoneNumber.substring(1);
    }

    const payload = {
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: Buffer.from(
        `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}`
      ).toString('base64'),
      Timestamp: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14),
      TransactionType: 'CustomerPayBillOnline',
      Amount: data.amount,
      PartyA: phoneNumber,
      PartyB: env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: env.MPESA_CALLBACK_URL || 'http://localhost:5000/api/v1/payments/mpesa-callback',
      AccountReference: reference,
      TransactionDesc: data.purpose,
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: data.amount,
        purpose: data.purpose,
        status: TransactionStatus.PENDING,
        checkoutRequestId: response.data.CheckoutRequestID,
        metadata: {
          phoneNumber: data.phoneNumber,
          reference,
          merchantRequestId: response.data.MerchantRequestID,
        },
      },
    });

    return {
      payment,
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
    };
  }

  static async handleCallback(callbackData: any) {
    const { Body } = callbackData;
    const { stkCallback } = Body;

    const payment = await prisma.payment.findFirst({
      where: {
        checkoutRequestId: stkCallback.CheckoutRequestID,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const isSuccess = stkCallback.ResultCode === 0;

    // Extract metadata - safely handle as object
    let metadata: Record<string, any> = {};
    
    // If payment.metadata exists, ensure it's an object
    if (payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)) {
      metadata = { ...payment.metadata };
    }

    if (stkCallback.CallbackMetadata) {
      const items = stkCallback.CallbackMetadata.Item;
      const metadataObj: Record<string, any> = {};
      items.forEach((item: any) => {
        metadataObj[item.Name] = item.Value;
      });
      metadata = { ...metadata, ...metadataObj };
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSuccess ? TransactionStatus.COMPLETED : TransactionStatus.FAILED,
        mpesaCode: isSuccess ? stkCallback.MerchantRequestID : undefined,
        completedAt: isSuccess ? new Date() : undefined,
        metadata,
      },
    });

    if (isSuccess) {
      // Handle successful payment based on purpose
      await this.handleSuccessfulPayment(payment.userId, payment.amount, payment.purpose, payment.id);
    }

    return updatedPayment;
  }

  private static async handleSuccessfulPayment(
    userId: string,
    amount: number,
    purpose: string,
    paymentId: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new Error('User or wallet not found');
    }

    switch (purpose) {
      case 'REGISTRATION':
        // Activate user account
        await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: true,
            registrationFeePaid: true,
            registrationDate: new Date(),
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId,
            walletId: user.wallet.id,
            type: 'REGISTRATION_FEE',
            amount,
            reference: `REG-${Date.now()}`,
            description: 'Registration fee payment',
            status: TransactionStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        break;

      case 'DEPOSIT':
        // Add to wallet balance
        await prisma.wallet.update({
          where: { userId },
          data: {
            balance: {
              increment: amount,
            },
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId,
            walletId: user.wallet.id,
            type: 'DEPOSIT',
            amount,
            reference: `DEP-${Date.now()}`,
            description: 'M-Pesa deposit',
            status: TransactionStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        break;

      case 'LOAN_REPAYMENT':
        // Find active loan
        const activeLoan = await prisma.loan.findFirst({
          where: {
            userId,
            status: 'ACTIVE',
          },
        });

        if (activeLoan) {
          await prisma.loan.update({
            where: { id: activeLoan.id },
            data: {
              balance: {
                decrement: amount,
              },
            },
          });

          await prisma.transaction.create({
            data: {
              userId,
              walletId: user.wallet.id,
              type: 'LOAN_REPAYMENT',
              amount,
              reference: `LOAN-REPAY-${Date.now()}`,
              description: 'M-Pesa loan repayment',
              status: TransactionStatus.COMPLETED,
              completedAt: new Date(),
              loanId: activeLoan.id,
            },
          });

          // Check if loan is fully paid
          const updatedLoan = await prisma.loan.findUnique({
            where: { id: activeLoan.id },
          });

          if (updatedLoan && updatedLoan.balance <= 0) {
            await prisma.loan.update({
              where: { id: activeLoan.id },
              data: {
                status: 'PAID',
                repaidAt: new Date(),
              },
            });
          }
        }
        break;
    }
  }
}
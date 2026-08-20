import axios from 'axios';
import { env } from '../../config/environment';
import { prisma } from '../../config/database';
import { TransactionStatus, TransactionType } from '../../shared/enums/transaction-types.enum';
import { MpesaPaymentDto } from './dto/mpesa.dto';

export class MpesaService {
  private static async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const url = env.MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data.access_token;
  }

  static async initiatePayment(userId: string, data: MpesaPaymentDto) {
    try {
      const accessToken = await this.getAccessToken();

      const reference = data.reference || `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      let phoneNumber = data.phoneNumber;
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '254' + phoneNumber.substring(1);
      } else if (phoneNumber.startsWith('+')) {
        phoneNumber = phoneNumber.substring(1);
      }

      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(
        `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`
      ).toString('base64');

      const url = env.MPESA_ENVIRONMENT === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

      const payload = {
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(data.amount),
        PartyA: phoneNumber,
        PartyB: env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: env.MPESA_CALLBACK_URL,
        AccountReference: reference,
        TransactionDesc: data.purpose,
      };

      console.log('M-Pesa Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('M-Pesa Response:', JSON.stringify(response.data, null, 2));

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
            responseCode: response.data.ResponseCode,
            responseDescription: response.data.ResponseDescription,
          },
        },
      });

      return {
        payment,
        checkoutRequestId: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
      };
    } catch (error: any) {
      console.error('M-Pesa initiation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || error.message || 'Payment initiation failed');
    }
  }

  static async handleCallback(callbackData: any) {
    try {
      console.log('M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2));

      // Check if the callback has the expected structure
      if (!callbackData || !callbackData.Body || !callbackData.Body.stkCallback) {
        console.error('Invalid callback structure:', callbackData);
        return { success: false, message: 'Invalid callback structure' };
      }

      const { Body } = callbackData;
      const { stkCallback } = Body;

      // Find the payment record
      const payment = await prisma.payment.findFirst({
        where: {
          checkoutRequestId: stkCallback.CheckoutRequestID,
        },
      });

      if (!payment) {
        console.error('Payment not found for checkout request:', stkCallback.CheckoutRequestID);
        return { success: false, message: 'Payment not found' };
      }

      // Determine if the payment was successful
      const isSuccess = stkCallback.ResultCode === 0;
      const resultDesc = stkCallback.ResultDesc || 'Payment processing completed';

      console.log(`Payment ${isSuccess ? 'SUCCESSFUL' : 'FAILED'}: ${resultDesc}`);

      // Build metadata object
      let metadata: Record<string, any> = {};
      
      if (payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)) {
        metadata = { ...payment.metadata };
      }

      // Add callback metadata
      if (stkCallback.CallbackMetadata) {
        const items = stkCallback.CallbackMetadata.Item;
        const metadataObj: Record<string, any> = {};
        items.forEach((item: any) => {
          metadataObj[item.Name] = item.Value;
        });
        metadata = { ...metadata, ...metadataObj };
      }

      // Add result info
      metadata.resultCode = stkCallback.ResultCode;
      metadata.resultDesc = resultDesc;

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? TransactionStatus.COMPLETED : TransactionStatus.FAILED,
          mpesaCode: isSuccess ? stkCallback.MerchantRequestID : undefined,
          completedAt: isSuccess ? new Date() : undefined,
          metadata,
        },
      });

      console.log('Payment updated:', {
        id: payment.id,
        status: isSuccess ? 'COMPLETED' : 'FAILED',
        checkoutRequestId: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: resultDesc,
      });

      // If payment was successful, process the transaction
      if (isSuccess) {
        console.log('Processing successful payment...');
        await this.handleSuccessfulPayment(payment.userId, payment.amount, payment.purpose, payment.id);
      } else {
        console.log('Processing failed payment...');
        await this.handleFailedPayment(payment.userId, payment.amount, payment.purpose, payment.id, resultDesc);
      }

      return { success: true, payment: updatedPayment };
    } catch (error: any) {
      console.error('M-Pesa callback error:', error.message);
      return { success: false, message: error.message };
    }
  }

 static async handleSuccessfulPayment(
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
    console.error('User or wallet not found for userId:', userId);
    return;
  }

  console.log('Processing successful payment:', { userId, amount, purpose });

  switch (purpose) {
    case 'REGISTRATION':
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          registrationFeePaid: true,
          registrationDate: new Date(),
        },
      });

      await prisma.transaction.create({
        data: {
          userId,
          walletId: user.wallet.id,
          type: TransactionType.REGISTRATION_FEE,
          amount,
          reference: `REG-${Date.now()}`,
          description: 'Registration fee payment via M-Pesa',
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          metadata: { paymentId },
        },
      });
      console.log('Registration fee processed successfully');
      break;

    case 'DEPOSIT':
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      await prisma.transaction.create({
        data: {
          userId,
          walletId: user.wallet.id,
          type: TransactionType.DEPOSIT,
          amount,
          reference: `DEP-${Date.now()}`,
          description: 'M-Pesa deposit',
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          metadata: { paymentId },
        },
      });
      console.log('Deposit processed successfully');
      break;

    case 'LOAN_REPAYMENT':
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
            type: TransactionType.LOAN_REPAYMENT,
            amount,
            reference: `LOAN-REPAY-${Date.now()}`,
            description: 'M-Pesa loan repayment',
            status: TransactionStatus.COMPLETED,
            completedAt: new Date(),
            loanId: activeLoan.id,
            metadata: { paymentId },
          },
        });

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
          console.log('Loan fully repaid');
        }
      }
      break;
  }
}
static async handleFailedPayment(
    userId: string,
    amount: number,
    purpose: string,
    paymentId: string,
    reason: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      console.error('User or wallet not found for userId:', userId);
      return;
    }

    console.log('Processing failed payment:', { userId, amount, purpose, reason });

    // Determine transaction type based on purpose - using the enum
    let transactionType: TransactionType;
    if (purpose === 'REGISTRATION') {
      transactionType = TransactionType.REGISTRATION_FEE;
    } else if (purpose === 'LOAN_REPAYMENT') {
      transactionType = TransactionType.LOAN_REPAYMENT;
    } else {
      transactionType = TransactionType.DEPOSIT;
    }

    // Create a failed transaction record
    await prisma.transaction.create({
      data: {
        userId,
        walletId: user.wallet.id,
        type: transactionType,
        amount,
        reference: `FAILED-${Date.now()}`,
        description: `Failed ${purpose} via M-Pesa: ${reason || 'Insufficient balance'}`,
        status: TransactionStatus.FAILED,
        metadata: { paymentId, reason: reason || 'Insufficient balance' },
      },
    });

    console.log('Failed transaction recorded');
  }

  static async checkPaymentStatus(checkoutRequestId: string) {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          checkoutRequestId,
        },
      });

      if (!payment) {
        return {
          status: 'NOT_FOUND',
          message: 'Payment not found',
        };
      }

      return {
        status: payment.status,
        payment: {
          id: payment.id,
          amount: payment.amount,
          purpose: payment.purpose,
          status: payment.status,
          mpesaCode: payment.mpesaCode,
          completedAt: payment.completedAt,
        },
        message: payment.status === 'COMPLETED' ? 'Payment completed successfully' : 
                  payment.status === 'FAILED' ? 'Payment failed' : 'Payment pending',
      };
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      return {
        status: 'ERROR',
        message: error.message,
      };
    }
  }
}
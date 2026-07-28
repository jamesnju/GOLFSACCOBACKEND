import { prisma } from '../../config/database';
import { TransactionType, TransactionStatus } from '../../shared/enums/transaction-types.enum';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { LoanStatus } from '../../shared/enums/loan-status.enum';

export class WalletService {
  static async deposit(userId: string, data: DepositDto) {
    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check if user has any active loans
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        status: LoanStatus.ACTIVE,
      },
    });

    // Generate unique reference
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: data.amount,
          },
        },
      });

      // Create transaction record
      const transactionRecord = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: TransactionType.DEPOSIT,
          amount: data.amount,
          reference,
          description: data.description || 'Deposit',
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          metadata: {
            paymentMethod: data.paymentMethod,
          },
        },
      });

      // If user has active loan, automatically deduct loan payment
      if (activeLoan) {
        const loanPaymentAmount = Math.min(data.amount * 0.3, activeLoan.balance);
        
        if (loanPaymentAmount > 0) {
          await tx.loan.update({
            where: { id: activeLoan.id },
            data: {
              balance: {
                decrement: loanPaymentAmount,
              },
            },
          });

          await tx.transaction.create({
            data: {
              userId,
              walletId: wallet.id,
              type: TransactionType.LOAN_REPAYMENT,
              amount: loanPaymentAmount,
              reference: `LOAN-REPAY-${Date.now()}`,
              description: `Loan repayment for ${activeLoan.id}`,
              status: TransactionStatus.COMPLETED,
              completedAt: new Date(),
              loanId: activeLoan.id,
            },
          });
        }
      }

      return transactionRecord;
    });

    return transaction;
  }

  static async withdraw(userId: string, data: WithdrawDto) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check if balance is sufficient
    if (wallet.balance < data.amount) {
      throw new Error('Insufficient balance');
    }

    // Check if user has any active loans (can't withdraw if has loans)
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        status: LoanStatus.ACTIVE,
      },
    });

    if (activeLoan) {
      throw new Error('Cannot withdraw while you have an active loan');
    }

    // Check if user has been a member for at least 6 months for large withdrawals
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      if (user.joinDate > sixMonthsAgo && data.amount > 10000) {
        throw new Error('Withdrawals above KES 10,000 require 6 months of membership');
      }
    }

    const reference = `WTH-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const transaction = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: data.amount,
          },
        },
      });

      const transactionRecord = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: TransactionType.WITHDRAWAL,
          amount: data.amount,
          reference,
          description: data.description || 'Withdrawal',
          status: TransactionStatus.PENDING,
          metadata: {
            bankAccount: data.bankAccount,
            mpesaNumber: data.mpesaNumber,
          },
        },
      });

      return transactionRecord;
    });

    return transaction;
  }

  static async getBalance(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            joinDate: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check if user is eligible for loans (6 months rule)
    const user = wallet.user;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const isEligibleForLoan = user.joinDate <= sixMonthsAgo;

    // Get active loan if any
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        status: LoanStatus.ACTIVE,
      },
    });

    return {
      balance: wallet.balance,
      lockedBalance: wallet.lockedBalance,
      availableBalance: wallet.balance - wallet.lockedBalance,
      isEligibleForLoan,
      activeLoan: activeLoan ? {
        id: activeLoan.id,
        amount: activeLoan.amount,
        balance: activeLoan.balance,
        dueDate: activeLoan.dueDate,
      } : null,
    };
  }
}
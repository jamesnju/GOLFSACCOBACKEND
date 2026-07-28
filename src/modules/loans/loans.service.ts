import { prisma } from '../../config/database';
import { LoanStatus } from '../../shared/enums/loan-status.enum';
import { TransactionType, TransactionStatus } from '../../shared/enums/transaction-types.enum';
import { ApplyLoanDto } from './dto/apply-loan.dto';

export class LoanService {
  static async applyForLoan(userId: string, data: ApplyLoanDto) {
    // Check if user is eligible (6 months rule)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check 6 months rule
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (user.joinDate > sixMonthsAgo) {
      throw new Error('You must be a member for at least 6 months to apply for a loan');
    }

    // Check if user has active loan
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        status: LoanStatus.ACTIVE,
      },
    });

    if (activeLoan) {
      throw new Error('You already have an active loan');
    }

    // Check loan limit (max 3x savings)
    const maxLoanAmount = user.wallet!.balance * 3;
    if (data.amount > maxLoanAmount) {
      throw new Error(`Maximum loan amount is KES ${maxLoanAmount}`);
    }

    // Check minimum savings for loan eligibility (KES 2,000)
    if (user.wallet!.balance < 2000) {
      throw new Error('You must have at least KES 2,000 in savings to apply for a loan');
    }

    // Calculate interest (5% flat rate)
    const interestRate = 0.05;
    const interest = data.amount * interestRate;
    const totalAmount = data.amount + interest;

    // Calculate due date
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + data.durationMonths);

    // Create loan application
    const loan = await prisma.loan.create({
      data: {
        userId,
        amount: data.amount,
        interestRate,
        totalAmount,
        balance: totalAmount,
        status: LoanStatus.PENDING,
        purpose: data.purpose,
        applicationDate: new Date(),
        dueDate,
        repayments: {
          create: [],
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            wallet: true,
          },
        },
      },
    });

    // Lock the equivalent amount in wallet
    await prisma.wallet.update({
      where: { userId },
      data: {
        lockedBalance: {
          increment: data.amount,
        },
      },
    });

    return loan;
  }

  static async approveLoan(adminId: string, loanId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: { include: { wallet: true } } },
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== LoanStatus.PENDING) {
      throw new Error('Loan has already been processed');
    }

    if (status === 'REJECTED') {
      // Release locked funds
      await prisma.wallet.update({
        where: { userId: loan.userId },
        data: {
          lockedBalance: {
            decrement: loan.amount,
          },
        },
      });

      return await prisma.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.REJECTED,
          rejectionReason,
          approvalDate: new Date(),
          approvedById: adminId,
        },
      });
    }

    // APPROVED - Disburse funds
    const result = await prisma.$transaction(async (tx) => {
      // Update loan status
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.ACTIVE,
          approvalDate: new Date(),
          approvedById: adminId,
        },
      });

      // Release locked funds from wallet
      await tx.wallet.update({
        where: { userId: loan.userId },
        data: {
          lockedBalance: {
            decrement: loan.amount,
          },
          balance: {
            increment: loan.amount, // Add loan amount to balance
          },
        },
      });

      // Create loan disbursement transaction
      await tx.transaction.create({
        data: {
          userId: loan.userId,
          walletId: loan.user.wallet!.id,
          type: TransactionType.LOAN_DISBURSEMENT,
          amount: loan.amount,
          reference: `LOAN-DISB-${Date.now()}`,
          description: `Loan disbursement - ${loan.purpose || 'General loan'}`,
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          loanId: loan.id,
        },
      });

      return updatedLoan;
    });

    return result;
  }

  static async getUserLoans(userId: string) {
    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        repayments: true,
      },
    });

    return loans;
  }

  static async getAllPendingLoans(adminId: string) {
    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    const loans = await prisma.loan.findMany({
      where: {
        status: LoanStatus.PENDING,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            wallet: true,
            joinDate: true,
          },
        },
      },
      orderBy: {
        applicationDate: 'asc',
      },
    });

    return loans;
  }

  static async checkEligibility(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const isEligible = user.joinDate <= sixMonthsAgo;

    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        status: LoanStatus.ACTIVE,
      },
    });

    return {
      isEligible,
      joinDate: user.joinDate,
      eligibleDate: new Date(user.joinDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000),
      hasActiveLoan: !!activeLoan,
      savingsBalance: user.wallet!.balance,
      maxLoanAmount: user.wallet!.balance * 3,
      minSavingsRequirement: 2000,
    };
  }
}
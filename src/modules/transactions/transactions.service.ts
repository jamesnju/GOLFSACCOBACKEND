import { prisma } from '../../config/database';
import { TransactionStatus } from '../../shared/enums/transaction-types.enum';

export class TransactionService {
  static async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
    type?: string,
    status?: string,
    startDate?: string,
    endDate?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getTransactionByReference(reference: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        wallet: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  static async getStatement(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary
    const summary = transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'DEPOSIT' || curr.type === 'LOAN_DISBURSEMENT') {
          acc.totalCredits += curr.amount;
        } else {
          acc.totalDebits += curr.amount;
        }
        return acc;
      },
      { totalCredits: 0, totalDebits: 0 }
    );

    return {
      transactions,
      summary: {
        totalCredits: summary.totalCredits,
        totalDebits: summary.totalDebits,
        balance: summary.totalCredits - summary.totalDebits,
      },
    };
  }
}
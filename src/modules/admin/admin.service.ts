import { prisma } from '../../config/database';
import { UserRole } from '../../shared/enums/roles.enum';
import { LoanStatus } from '../../shared/enums/loan-status.enum';

export class AdminService {
  static async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalSavings,
      totalLoans,
      activeLoans,
      totalTransactions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.wallet.aggregate({
        _sum: { balance: true },
      }),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: LoanStatus.ACTIVE } }),
      prisma.transaction.count(),
    ]);

    // Get user by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Get pending loans
    const pendingLoans = await prisma.loan.findMany({
      where: { status: LoanStatus.PENDING },
      take: 5,
      orderBy: { applicationDate: 'asc' },
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
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole,
      },
      finances: {
        totalSavings: totalSavings._sum.balance || 0,
        totalLoans,
        activeLoans,
      },
      transactions: {
        total: totalTransactions,
        recent: recentTransactions,
      },
      pendingLoans,
    };
  }

  static async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          _count: {
            select: {
              transactions: true,
              loans: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwords
    const sanitizedUsers = users.map(({ password, ...user }) => user);

    return {
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        loans: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async activateUser(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        registrationFeePaid: true,
        registrationDate: new Date(),
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async deactivateUser(userId: string) {
    // Check if user has active loans
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        status: LoanStatus.ACTIVE,
      },
    });

    if (activeLoan) {
      throw new Error('Cannot deactivate user with active loans');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async getTransactionAnalytics(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const transactions = await prisma.transaction.findMany({
      where,
    });

    const summary = transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'DEPOSIT' || curr.type === 'LOAN_DISBURSEMENT') {
          acc.totalInflow += curr.amount;
        } else {
          acc.totalOutflow += curr.amount;
        }
        return acc;
      },
      { totalInflow: 0, totalOutflow: 0 }
    );

    // Group by type
    const byType = transactions.reduce((acc: any, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + curr.amount;
      return acc;
    }, {});

    return {
      totalTransactions: transactions.length,
      totalInflow: summary.totalInflow,
      totalOutflow: summary.totalOutflow,
      netFlow: summary.totalInflow - summary.totalOutflow,
      byType,
      transactions,
    };
  }
}
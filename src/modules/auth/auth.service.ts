import { prisma } from "../../config/database";
import { HashService } from "../../shared/utils/hash";
import { JwtService } from "../../shared/utils/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UserRole } from "../../shared/enums/roles.enum";
import { Prisma } from "@prisma/client";

export class AuthService {
  static async register(data: RegisterDto) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existingUser) {
      throw new Error("User with this email or phone already exists");
    }

    // Hash password
    const hashedPassword = await HashService.hashPassword(data.password);

    // Create user with wallet
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as UserRole,
        // isActive: false, // Not active until registration fee is paid
        // registrationFeePaid: false,
        isActive: true, // Not active until registration fee is paid
        registrationFeePaid: true,
        joinDate: new Date(),
        wallet: {
          create: {
            balance: 0,
            lockedBalance: 0,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtService.generateAccessToken(tokenPayload);
    const refreshToken = JwtService.generateRefreshToken(tokenPayload);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async login(data: LoginDto) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { wallet: true },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    // if (!user.isActive) {
    //   throw new Error(
    //     "Account not activated. Please pay the registration fee.",
    //   );
    // }

    // Verify password
    const isPasswordValid = await HashService.comparePassword(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtService.generateAccessToken(tokenPayload);
    const refreshToken = JwtService.generateRefreshToken(tokenPayload);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const payload = JwtService.verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const newTokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = JwtService.generateAccessToken(newTokenPayload);
      const newRefreshToken = JwtService.generateRefreshToken(newTokenPayload);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }
}

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  RegisterDto,
  LoginDto,
  RequestOtpDto,
  VerifyOtpDto,
  AuthTokens,
  SessionUser,
} from '@schoolbridge/types';

const OTP_TTL_MINUTES = 10;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone number already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        locale: dto.locale,
      },
      include: { memberships: { select: { schoolId: true, role: true } } },
    });

    return this.issueTokens(user.id, dto.phone);
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone, deletedAt: null },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.phone);
  }

  // ── OTP: Request ──────────────────────────────────────────────────────────

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone, deletedAt: null },
    });
    if (!user) throw new BadRequestException('Phone number not registered');

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    // TODO: send via Termii SMS — replace the logger call with:
    //   await this.termiiService.sendSms(dto.phone, `Your SchoolBridge OTP is ${code}. Valid for ${OTP_TTL_MINUTES} minutes.`);
    this.logger.log(`[OTP STUB] Phone=${dto.phone} Code=${code} (not sent via SMS in dev)`);

    return { message: 'OTP sent' };
  }

  // ── OTP: Verify ───────────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone, deletedAt: null },
    });
    if (!user) throw new BadRequestException('Phone number not registered');

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code: dto.code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.$transaction([
      this.prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
      }),
    ]);

    return this.issueTokens(user.id, user.phone);
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  async refresh(token: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(token);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.userId, stored.user.phone);
  }

  // ── Me ────────────────────────────────────────────────────────────────────

  async getMe(userId: string): Promise<SessionUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId, deletedAt: null },
      include: { memberships: { select: { schoolId: true, role: true } } },
    });

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      locale: user.locale,
      memberships: user.memberships,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async issueTokens(userId: string, phone: string): Promise<AuthTokens> {
    const payload = { sub: userId, phone };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
    });

    const refreshTokenRaw = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(refreshTokenRaw);
    const refreshTtl = this.config.get('JWT_REFRESH_TTL', '7d');
    const expiresAt = new Date(Date.now() + this.parseDuration(refreshTtl));

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken: refreshTokenRaw };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Parse simple duration strings like '7d', '15m', '1h' to milliseconds. */
  private parseDuration(ttl: string): number {
    const unit = ttl.slice(-1);
    const value = parseInt(ttl.slice(0, -1), 10);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? 1000);
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Logger (pino) ────────────────────────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        level: process.env['LOG_LEVEL'] ?? 'info',
        redact: ['req.headers.authorization'],
      },
    }),

    // ── Core ─────────────────────────────────────────────────────────────────
    PrismaModule,
    HealthModule,

    // ── Feature modules ───────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    SchoolsModule,
    MessagesModule,
    NotificationsModule,
    RealtimeModule,
  ],
})
export class AppModule {}

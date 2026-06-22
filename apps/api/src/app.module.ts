import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { GuardianModule } from './common/guardian/guardian.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PupilsModule } from './modules/pupils/pupils.module';
import { ParentsModule } from './modules/parents/parents.module';
import { ClassesModule } from './modules/classes/classes.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { AcademicModule } from './modules/academic/academic.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ResultsModule } from './modules/results/results.module';
import { FeesModule } from './modules/fees/fees.module';
import { PlatformModule } from './modules/platform/platform.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PlansModule } from './modules/plans/plans.module';
import { AuditModule } from './modules/audit/audit.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MediaModule } from './modules/media/media.module';
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
    GuardianModule,
    HealthModule,

    // ── Feature modules ───────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    SchoolsModule,
    PupilsModule,
    ParentsModule,
    ClassesModule,
    SubjectsModule,
    AcademicModule,
    AttendanceModule,
    ResultsModule,
    FeesModule,
    PlatformModule,
    SubscriptionsModule,
    PlansModule,
    AuditModule,
    AnalyticsModule,
    MediaModule,
    MessagesModule,
    NotificationsModule,
    RealtimeModule,
  ],
})
export class AppModule {}

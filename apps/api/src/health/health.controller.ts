import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check — returns ok status + DB connectivity' })
  async check() {
    let dbStatus: 'ok' | 'error' = 'ok';
    let dbMessage: string | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = 'error';
      dbMessage = (err as Error).message;
    }

    const overall = dbStatus === 'ok' ? 'ok' : 'degraded';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      services: {
        database: { status: dbStatus, ...(dbMessage ? { message: dbMessage } : {}) },
      },
    };
  }
}

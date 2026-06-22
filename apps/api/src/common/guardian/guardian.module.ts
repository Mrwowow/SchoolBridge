import { Global, Module } from '@nestjs/common';
import { GuardianAccessService } from './guardian-access.service';

/** Global so any feature module can inject GuardianAccessService directly. */
@Global()
@Module({
  providers: [GuardianAccessService],
  exports: [GuardianAccessService],
})
export class GuardianModule {}

import { Module } from '@nestjs/common';
import { PupilsController } from './pupils.controller';
import { PupilsService } from './pupils.service';

@Module({
  controllers: [PupilsController],
  providers: [PupilsService],
})
export class PupilsModule {}

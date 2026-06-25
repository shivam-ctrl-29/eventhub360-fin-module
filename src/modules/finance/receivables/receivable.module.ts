import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '../../../common/constants';
import { ReceivableController } from './receivable.controller';
import { ReceivableService } from './receivable.service';
import { DunningService } from './dunning.service';
import { DunningProcessor } from './dunning.processor';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.DUNNING })],
  controllers: [ReceivableController],
  providers: [ReceivableService, DunningService, DunningProcessor],
  exports: [ReceivableService, DunningService],
})
export class ReceivableModule {}

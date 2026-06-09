import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { ConciergeController } from './concierge.controller';
import { ConciergeService } from './concierge.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [ConciergeController],
  providers: [ConciergeService],
  exports: [ConciergeService],
})
export class ConciergeModule {}

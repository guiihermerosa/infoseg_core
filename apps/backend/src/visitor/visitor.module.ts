import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { EventsModule } from '../events/events.module';
import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';

@Module({
  imports: [PrismaModule, StorageModule, EventsModule],
  controllers: [VisitorController],
  providers: [VisitorService],
  exports: [VisitorService],
})
export class VisitorModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { VisitorModule } from './visitor/visitor.module';
import { EventsModule } from './events/events.module';
import { ResidentModule } from './resident/resident.module';
import { ConciergeModule } from './concierge/concierge.module';
import { CameraModule } from './camera/camera.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, StorageModule, AuthModule, VisitorModule, EventsModule, ResidentModule, ConciergeModule, CameraModule, AdminModule],
})
export class AppModule {}

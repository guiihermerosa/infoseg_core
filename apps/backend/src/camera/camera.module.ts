import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { CameraController } from './camera.controller';
import { CameraService } from './camera.service';
import { CameraPtzService } from './camera-ptz.service';
import { CameraHealthService } from './camera-health.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [CameraController],
  providers: [CameraService, CameraPtzService, CameraHealthService],
  exports: [CameraService, CameraHealthService],
})
export class CameraModule {}

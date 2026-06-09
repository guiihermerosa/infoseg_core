import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AccessPointService } from './access-point.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, AccessPointService],
  exports: [AdminService, AccessPointService],
})
export class AdminModule {}

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        signOptions: {
          expiresIn: process.env.JWT_EXPIRES_IN || '8h',
        },
      }),
    }),
  ],
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class EventsModule {}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

/**
 * Service for monitoring camera health (online/offline status).
 *
 * In production, this would run periodic health checks (heartbeats)
 * every 10 seconds. For now, exposes methods to mark cameras
 * online/offline and emit corresponding WebSocket events.
 *
 * Requirements: 7.7, 7.8
 */
@Injectable()
export class CameraHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Mark a camera as offline and emit camera_offline event.
   * Called when heartbeat is absent for > 10 seconds.
   *
   * Requirement 7.7
   */
  async markOffline(cameraId: string): Promise<void> {
    const camera = await this.prisma.camera.findUnique({
      where: { id: cameraId },
      select: { id: true, name: true, is_online: true },
    });

    if (!camera) {
      return;
    }

    // Only update and emit if currently online
    if (camera.is_online) {
      await this.prisma.camera.update({
        where: { id: cameraId },
        data: { is_online: false },
      });

      this.eventsService.emitToConcierge('camera_offline', {
        camera_id: cameraId,
        camera_name: camera.name,
      });
    }
  }

  /**
   * Mark a camera as online and emit camera_online event.
   * Called when heartbeat is re-established after being offline.
   *
   * Requirement 7.8
   */
  async markOnline(cameraId: string): Promise<void> {
    const camera = await this.prisma.camera.findUnique({
      where: { id: cameraId },
      select: { id: true, name: true, is_online: true },
    });

    if (!camera) {
      return;
    }

    // Only update and emit if currently offline
    if (!camera.is_online) {
      await this.prisma.camera.update({
        where: { id: cameraId },
        data: { is_online: true },
      });

      this.eventsService.emitToConcierge('camera_online', {
        camera_id: cameraId,
        camera_name: camera.name,
      });
    }
  }

  /**
   * Check health status of a specific camera.
   * In production, this would attempt an ONVIF probe or ping.
   */
  async checkHealth(cameraId: string): Promise<'online' | 'offline'> {
    const camera = await this.prisma.camera.findUnique({
      where: { id: cameraId },
      select: { is_online: true },
    });

    if (!camera) {
      return 'offline';
    }

    return camera.is_online ? 'online' : 'offline';
  }

  /**
   * Run health checks for all cameras.
   * In production, this would be called by a scheduled task (e.g., @Cron).
   * For each camera, attempts connection and marks online/offline accordingly.
   */
  async checkAllCameras(): Promise<void> {
    const cameras = await this.prisma.camera.findMany({
      select: { id: true, ip_address: true, onvif_port: true, is_online: true },
    });

    for (const camera of cameras) {
      // Simulate health check — in production would attempt ONVIF connection
      const isReachable = await this.simulateHealthCheck(
        camera.ip_address,
        camera.onvif_port,
      );

      if (isReachable && !camera.is_online) {
        await this.markOnline(camera.id);
      } else if (!isReachable && camera.is_online) {
        await this.markOffline(camera.id);
      }
    }
  }

  /**
   * Simulate a health check for a camera.
   * In production, would attempt ONVIF probe with timeout.
   */
  private async simulateHealthCheck(
    _ipAddress: string,
    _onvifPort: number,
  ): Promise<boolean> {
    // Simulated — returns current state. In production: actual ONVIF probe.
    return false;
  }
}

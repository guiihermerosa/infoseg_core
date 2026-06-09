import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';

/**
 * Fields to select when returning camera data (excludes credentials).
 * Requirement 11.4: Never expose username/password in responses.
 */
const CAMERA_PUBLIC_SELECT = {
  id: true,
  name: true,
  ip_address: true,
  onvif_port: true,
  rtsp_port: true,
  rtsp_url: true,
  connection_type: true,
  ptz_supported: true,
  location_zone: true,
  is_online: true,
  created_at: true,
  updated_at: true,
};

@Injectable()
export class CameraService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new camera.
   * - Validates uniqueness of (ip_address, onvif_port)
   * - Simulates ONVIF connection test
   * - Returns camera data without credentials + connection_status
   *
   * Requirements: 11.1, 11.2, 11.6
   */
  async create(dto: CreateCameraDto) {
    // Check uniqueness of (ip_address, onvif_port)
    const existing = await this.prisma.camera.findUnique({
      where: {
        ip_address_onvif_port: {
          ip_address: dto.ip_address,
          onvif_port: dto.onvif_port,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Já existe uma câmera cadastrada com ip_address ${dto.ip_address} e onvif_port ${dto.onvif_port}`,
      );
    }

    // Create camera in the database
    const camera = await this.prisma.camera.create({
      data: {
        name: dto.name,
        ip_address: dto.ip_address,
        onvif_port: dto.onvif_port,
        rtsp_port: dto.rtsp_port,
        rtsp_url: dto.rtsp_url || null,
        connection_type: dto.connection_type || 'onvif',
        username: dto.username,
        password: dto.password,
        ptz_supported: dto.ptz_supported,
        location_zone: dto.location_zone,
        is_online: false,
      },
      select: CAMERA_PUBLIC_SELECT,
    });

    // Simulate ONVIF connection test (Requirement 11.2)
    const connectionStatus = await this.testOnvifConnection(
      dto.ip_address,
      dto.onvif_port,
    );

    // Update is_online based on connection test
    if (connectionStatus === 'online') {
      await this.prisma.camera.update({
        where: { id: camera.id },
        data: { is_online: true },
      });
      camera.is_online = true;
    }

    return {
      ...camera,
      connection_status: connectionStatus,
    };
  }

  /**
   * List all cameras (paginated), excluding credentials.
   * Requirement 11.5: Max 100 per page.
   */
  async findAll(page: number = 1, limit: number = 20) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const [cameras, total] = await Promise.all([
      this.prisma.camera.findMany({
        select: CAMERA_PUBLIC_SELECT,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.camera.count(),
    ]);

    return { cameras, total };
  }

  /**
   * Find a single camera by ID (without credentials).
   */
  async findOne(id: string) {
    const camera = await this.prisma.camera.findUnique({
      where: { id },
      select: CAMERA_PUBLIC_SELECT,
    });

    if (!camera) {
      throw new NotFoundException(`Câmera com id ${id} não encontrada`);
    }

    return camera;
  }

  /**
   * Update a camera.
   * - Validates uniqueness if ip_address or onvif_port changed
   * - Simulates ONVIF connection test
   *
   * Requirements: 11.2, 11.3, 11.6
   */
  async update(id: string, dto: UpdateCameraDto) {
    const existing = await this.prisma.camera.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Câmera com id ${id} não encontrada`);
    }

    // Check uniqueness if ip_address or onvif_port is being changed
    const newIp = dto.ip_address ?? existing.ip_address;
    const newPort = dto.onvif_port ?? existing.onvif_port;

    if (newIp !== existing.ip_address || newPort !== existing.onvif_port) {
      const duplicate = await this.prisma.camera.findUnique({
        where: {
          ip_address_onvif_port: {
            ip_address: newIp,
            onvif_port: newPort,
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Já existe uma câmera cadastrada com ip_address ${newIp} e onvif_port ${newPort}`,
        );
      }
    }

    // Build update data (only provided fields)
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.ip_address !== undefined) updateData.ip_address = dto.ip_address;
    if (dto.onvif_port !== undefined) updateData.onvif_port = dto.onvif_port;
    if (dto.rtsp_port !== undefined) updateData.rtsp_port = dto.rtsp_port;
    if (dto.username !== undefined) updateData.username = dto.username;
    if (dto.password !== undefined) updateData.password = dto.password;
    if (dto.ptz_supported !== undefined)
      updateData.ptz_supported = dto.ptz_supported;
    if (dto.location_zone !== undefined)
      updateData.location_zone = dto.location_zone;

    const camera = await this.prisma.camera.update({
      where: { id },
      data: updateData,
      select: CAMERA_PUBLIC_SELECT,
    });

    // Simulate ONVIF connection test
    const connectionStatus = await this.testOnvifConnection(newIp, newPort);

    // Update is_online based on connection test
    const isOnline = connectionStatus === 'online';
    if (camera.is_online !== isOnline) {
      await this.prisma.camera.update({
        where: { id },
        data: { is_online: isOnline },
      });
      camera.is_online = isOnline;
    }

    return {
      ...camera,
      connection_status: connectionStatus,
    };
  }

  /**
   * Delete a camera by ID.
   */
  async delete(id: string) {
    const existing = await this.prisma.camera.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Câmera com id ${id} não encontrada`);
    }

    await this.prisma.camera.delete({ where: { id } });

    return { deleted: true };
  }

  /**
   * Get stream URL for a camera.
   * Returns the MediaMTX path and protocol.
   */
  async getStreamUrl(id: string) {
    const camera = await this.prisma.camera.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!camera) {
      throw new NotFoundException(`Câmera com id ${id} não encontrada`);
    }

    return {
      stream_url: `/cam-${id}`,
      protocol: 'whep' as const,
    };
  }

  /**
   * Test ONVIF connection to a camera.
   * Uses node-onvif to actually probe the device.
   * Timeout of 5 seconds.
   */
  private async testOnvifConnection(
    ipAddress: string,
    onvifPort: number,
  ): Promise<'online' | 'offline'> {
    try {
      const { OnvifDevice } = await import('node-onvif');
      const device = new OnvifDevice({
        xaddr: `http://${ipAddress}:${onvifPort}/onvif/device_service`,
      });

      // Race between init and timeout
      await Promise.race([
        device.init(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000),
        ),
      ]);

      return 'online';
    } catch (error: any) {
      // Log for debugging but return offline gracefully
      console.log(`Camera ONVIF probe failed (${ipAddress}:${onvifPort}): ${error.message || error}`);
      return 'offline';
    }
  }
}

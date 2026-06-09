import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PtzCommand } from '@infoseg/shared';

/**
 * Service for sending PTZ (Pan-Tilt-Zoom) commands to cameras.
 *
 * Requirements: 8.1, 8.2, 8.4
 */
@Injectable()
export class CameraPtzService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a PTZ command to a camera.
   * - Validates camera exists and supports PTZ
   * - Simulates ONVIF PTZ call
   * - Returns success or throws 502 on timeout
   */
  async sendCommand(
    cameraId: string,
    command: PtzCommand,
  ): Promise<{ success: boolean }> {
    const camera = await this.prisma.camera.findUnique({
      where: { id: cameraId },
      select: {
        id: true,
        ip_address: true,
        onvif_port: true,
        ptz_supported: true,
        is_online: true,
      },
    });

    if (!camera) {
      throw new NotFoundException(`Câmera com id ${cameraId} não encontrada`);
    }

    if (!camera.ptz_supported) {
      throw new BadRequestException(
        `Câmera ${cameraId} não suporta controle PTZ`,
      );
    }

    if (!camera.is_online) {
      throw new BadGatewayException(
        'Falha de comunicação com a câmera: câmera offline',
      );
    }

    // Validate command is in the enum
    const validCommands = Object.values(PtzCommand);
    if (!validCommands.includes(command)) {
      throw new BadRequestException(
        `Comando PTZ inválido. Valores aceitos: ${validCommands.join(', ')}`,
      );
    }

    // Simulate ONVIF PTZ call
    // In production, this would use node-onvif:
    // const device = new OnvifDevice({ xaddr: ... });
    // await device.init();
    // const velocity = this.mapCommandToVelocity(command);
    // await device.services.ptz.continuousMove({ ... });
    // await sleep(300); // discrete step
    // await device.services.ptz.stop({ ... });
    const success = await this.simulateOnvifPtzCall(camera.ip_address, camera.onvif_port, command);

    if (!success) {
      throw new BadGatewayException(
        'Falha de comunicação com a câmera: timeout na execução do comando PTZ',
      );
    }

    return { success: true };
  }

  /**
   * Simulate ONVIF PTZ call.
   * In production, would connect via node-onvif and send the command.
   * If timeout > 5s, returns false (triggering HTTP 502).
   */
  private async simulateOnvifPtzCall(
    _ipAddress: string,
    _onvifPort: number,
    _command: PtzCommand,
  ): Promise<boolean> {
    // Simulated — always succeeds in dev environment.
    // In production:
    // - Maps command to ONVIF velocity vector
    // - Sends continuousMove + stop after 300ms for directional
    // - Returns false if timeout > 5s
    return true;
  }

  /**
   * Map a PTZ command to ONVIF velocity values.
   * Used in production with actual ONVIF devices.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mapCommandToVelocity(command: PtzCommand): {
    x: number;
    y: number;
    zoom: number;
  } {
    const speed = 0.5;
    switch (command) {
      case PtzCommand.UP:
        return { x: 0, y: speed, zoom: 0 };
      case PtzCommand.DOWN:
        return { x: 0, y: -speed, zoom: 0 };
      case PtzCommand.LEFT:
        return { x: -speed, y: 0, zoom: 0 };
      case PtzCommand.RIGHT:
        return { x: speed, y: 0, zoom: 0 };
      case PtzCommand.ZOOM_IN:
        return { x: 0, y: 0, zoom: speed };
      case PtzCommand.ZOOM_OUT:
        return { x: 0, y: 0, zoom: -speed };
      default:
        return { x: 0, y: 0, zoom: 0 };
    }
  }
}

import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as http from 'http';
import * as net from 'net';

/**
 * Supported protocols for access point controllers (relays/gates)
 */
export type AccessPointProtocol = 'http_get' | 'http_post' | 'tcp_socket' | 'onvif_output' | 'intelbras_api';

export interface CreateAccessPointDto {
  name: string;
  description?: string;
  protocol: AccessPointProtocol;
  ip_address: string;
  port: number;
  endpoint_path?: string;
  username?: string;
  password?: string;
  relay_channel?: number;
  pulse_duration?: number;
}

export interface UpdateAccessPointDto extends Partial<CreateAccessPointDto> {}

@Injectable()
export class AccessPointService {
  private readonly logger = new Logger(AccessPointService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.accessPoint.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateAccessPointDto) {
    const accessPoint = await this.prisma.accessPoint.create({
      data: {
        id: uuidv4(),
        name: dto.name,
        description: dto.description || null,
        protocol: dto.protocol,
        ip_address: dto.ip_address,
        port: dto.port,
        endpoint_path: dto.endpoint_path || null,
        username: dto.username || null,
        password: dto.password || null,
        relay_channel: dto.relay_channel || 1,
        pulse_duration: dto.pulse_duration || 1000,
        is_online: false,
      },
    });

    return accessPoint;
  }

  async update(id: string, dto: UpdateAccessPointDto) {
    const existing = await this.prisma.accessPoint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Ponto de acesso não encontrado.');

    return this.prisma.accessPoint.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.protocol !== undefined && { protocol: dto.protocol }),
        ...(dto.ip_address !== undefined && { ip_address: dto.ip_address }),
        ...(dto.port !== undefined && { port: dto.port }),
        ...(dto.endpoint_path !== undefined && { endpoint_path: dto.endpoint_path }),
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.password !== undefined && { password: dto.password }),
        ...(dto.relay_channel !== undefined && { relay_channel: dto.relay_channel }),
        ...(dto.pulse_duration !== undefined && { pulse_duration: dto.pulse_duration }),
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.accessPoint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Ponto de acesso não encontrado.');
    await this.prisma.accessPoint.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Trigger (activate) a relay — sends the command to open the gate/door.
   */
  async trigger(id: string): Promise<{ success: boolean; message: string }> {
    const ap = await this.prisma.accessPoint.findUnique({ where: { id } });
    if (!ap) throw new NotFoundException('Ponto de acesso não encontrado.');

    try {
      switch (ap.protocol) {
        case 'http_get':
          await this.triggerHttpGet(ap);
          break;
        case 'http_post':
          await this.triggerHttpPost(ap);
          break;
        case 'tcp_socket':
          await this.triggerTcpSocket(ap);
          break;
        case 'intelbras_api':
          await this.triggerIntelbrasApi(ap);
          break;
        case 'onvif_output':
          await this.triggerOnvifOutput(ap);
          break;
        default:
          return { success: false, message: `Protocolo '${ap.protocol}' não suportado.` };
      }

      // Mark as online after successful trigger
      await this.prisma.accessPoint.update({ where: { id }, data: { is_online: true } });
      return { success: true, message: `Relé '${ap.name}' acionado com sucesso.` };
    } catch (error: any) {
      this.logger.error(`Falha ao acionar relé '${ap.name}': ${error.message}`);
      return { success: false, message: `Falha: ${error.message}` };
    }
  }

  // ─── Protocol Implementations ───────────────────────────────────────────

  private triggerHttpGet(ap: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `http://${ap.ip_address}:${ap.port}${ap.endpoint_path || '/'}`;
      const timeout = ap.pulse_duration || 3000;

      const req = http.get(url, { timeout, headers: this.getAuthHeaders(ap) }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
  }

  private triggerHttpPost(ap: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(`http://${ap.ip_address}:${ap.port}${ap.endpoint_path || '/'}`);
      const timeout = ap.pulse_duration || 3000;

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        timeout,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(ap),
        },
      };

      const body = JSON.stringify({ channel: ap.relay_channel, duration: ap.pulse_duration });

      const req = http.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.write(body);
      req.end();
    });
  }

  private triggerTcpSocket(ap: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      const timeout = ap.pulse_duration || 3000;

      client.setTimeout(timeout);
      client.connect(ap.port, ap.ip_address, () => {
        // Send relay trigger command (common format: channel byte)
        const command = Buffer.from([0xA0, ap.relay_channel || 1, 0x01, 0xA2]);
        client.write(command);
        setTimeout(() => {
          client.destroy();
          resolve();
        }, 500);
      });
      client.on('error', (e) => { client.destroy(); reject(e); });
      client.on('timeout', () => { client.destroy(); reject(new Error('Timeout')); });
    });
  }

  private triggerIntelbrasApi(ap: any): Promise<void> {
    // Intelbras uses a CGI-based API
    return new Promise((resolve, reject) => {
      const path = ap.endpoint_path || `/cgi-bin/accessControl.cgi?action=openDoor&channel=${ap.relay_channel || 1}`;
      const auth = ap.username && ap.password
        ? Buffer.from(`${ap.username}:${ap.password}`).toString('base64')
        : null;

      const options = {
        hostname: ap.ip_address,
        port: ap.port,
        path,
        method: 'GET',
        timeout: ap.pulse_duration || 3000,
        headers: auth ? { Authorization: `Basic ${auth}` } : {},
      };

      const req = http.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.end();
    });
  }

  private triggerOnvifOutput(ap: any): Promise<void> {
    // ONVIF Digital Output trigger - simplified
    // In production would use node-onvif setRelayOutputState
    return this.triggerHttpGet(ap);
  }

  private getAuthHeaders(ap: any): Record<string, string> {
    if (ap.username && ap.password) {
      const auth = Buffer.from(`${ap.username}:${ap.password}`).toString('base64');
      return { Authorization: `Basic ${auth}` };
    }
    return {};
  }
}

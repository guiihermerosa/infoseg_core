import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// ─── System Config ───────────────────────────────────────────────────────────

export interface SystemConfig {
  condominium_name: string;
  condominium_address: string;
  timezone: string;
  intercom_timeout_seconds: number;
  camera_heartbeat_interval_seconds: number;
  max_login_attempts: number;
  login_block_duration_minutes: number;
  invite_default_validity_hours: number;
  media_gateway_url: string;
  storage_type: string;
  max_image_size_mb: number;
}

let systemConfig: SystemConfig = {
  condominium_name: 'Condomínio INFOSEG',
  condominium_address: '',
  timezone: 'America/Sao_Paulo',
  intercom_timeout_seconds: 30,
  camera_heartbeat_interval_seconds: 10,
  max_login_attempts: 5,
  login_block_duration_minutes: 15,
  invite_default_validity_hours: 24,
  media_gateway_url: process.env.MEDIAMTX_URL || 'http://localhost:8889',
  storage_type: process.env.STORAGE_TYPE || 'local',
  max_image_size_mb: 10,
};

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateResidentDto {
  name: string;
  email: string;
  phone: string;
  apartment_number: string;
  block: string;
  password: string;
}

export interface UpdateResidentDto {
  name?: string;
  email?: string;
  phone?: string;
  apartment_number?: string;
  block?: string;
  password?: string;
}

export interface CreateConciergeDto {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateConciergeDto {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'resident' | 'concierge';
  apartment_number?: string;
  block?: string;
  created_at: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const BCRYPT_COST = 12;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── System Config ──────────────────────────────────────────────────────

  getSystemConfig(): SystemConfig {
    return { ...systemConfig };
  }

  updateSystemConfig(partial: Partial<SystemConfig>): SystemConfig {
    systemConfig = { ...systemConfig, ...partial };
    return { ...systemConfig };
  }

  async getSystemStats() {
    const [residentsCount, visitorsCount, camerasCount, conciergesCount, pendingVisits] =
      await Promise.all([
        this.prisma.resident.count(),
        this.prisma.visitor.count(),
        this.prisma.camera.count(),
        this.prisma.concierge.count(),
        this.prisma.visit.count({ where: { status: 'pending' } }),
      ]);

    return {
      residents: residentsCount,
      visitors: visitorsCount,
      cameras: camerasCount,
      concierges: conciergesCount,
      pending_visits: pendingVisits,
    };
  }

  // ─── User Management ───────────────────────────────────────────────────

  async listAllUsers(): Promise<UserListItem[]> {
    const [residents, concierges] = await Promise.all([
      this.prisma.resident.findMany({
        select: { id: true, name: true, email: true, phone: true, apartment_number: true, block: true, created_at: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.concierge.findMany({
        select: { id: true, name: true, email: true, phone: true, created_at: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const users: UserListItem[] = [
      ...concierges.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: 'concierge' as const,
        created_at: c.created_at.toISOString(),
      })),
      ...residents.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: 'resident' as const,
        apartment_number: r.apartment_number,
        block: r.block,
        created_at: r.created_at.toISOString(),
      })),
    ];

    return users;
  }

  // ─── Residents CRUD ─────────────────────────────────────────────────────

  async createResident(dto: CreateResidentDto) {
    const existing = await this.prisma.resident.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Já existe um morador com este e-mail.');
    }

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const resident = await this.prisma.resident.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        apartment_number: dto.apartment_number,
        block: dto.block,
        password_hash,
      },
      select: { id: true, name: true, email: true, phone: true, apartment_number: true, block: true, created_at: true },
    });

    return resident;
  }

  async updateResident(id: string, dto: UpdateResidentDto) {
    const existing = await this.prisma.resident.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Morador não encontrado.');
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.resident.findUnique({ where: { email: dto.email } });
      if (emailTaken) {
        throw new ConflictException('E-mail já em uso por outro morador.');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.apartment_number !== undefined) updateData.apartment_number = dto.apartment_number;
    if (dto.block !== undefined) updateData.block = dto.block;
    if (dto.password) {
      updateData.password_hash = await bcrypt.hash(dto.password, BCRYPT_COST);
    }

    return this.prisma.resident.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, apartment_number: true, block: true, created_at: true },
    });
  }

  async deleteResident(id: string) {
    const existing = await this.prisma.resident.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Morador não encontrado.');
    }
    await this.prisma.resident.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Concierges CRUD ────────────────────────────────────────────────────

  async createConcierge(dto: CreateConciergeDto) {
    const existing = await this.prisma.concierge.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Já existe um porteiro com este e-mail.');
    }

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const concierge = await this.prisma.concierge.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password_hash,
      },
      select: { id: true, name: true, email: true, phone: true, created_at: true },
    });

    return concierge;
  }

  async updateConcierge(id: string, dto: UpdateConciergeDto) {
    const existing = await this.prisma.concierge.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Porteiro não encontrado.');
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.concierge.findUnique({ where: { email: dto.email } });
      if (emailTaken) {
        throw new ConflictException('E-mail já em uso por outro porteiro.');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.password) {
      updateData.password_hash = await bcrypt.hash(dto.password, BCRYPT_COST);
    }

    return this.prisma.concierge.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, created_at: true },
    });
  }

  async deleteConcierge(id: string) {
    const existing = await this.prisma.concierge.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Porteiro não encontrado.');
    }
    await this.prisma.concierge.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── System Logs ────────────────────────────────────────────────────────

  async getSystemLogs(page: number = 1, limit: number = 50, type?: string) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;

    const where: Record<string, unknown> = {};
    if (type && type !== 'all') {
      where.action_type = type;
    }

    const [logs, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        user_id: log.user_id,
        user_type: log.user_type,
        action_type: log.action_type,
        access_point: log.access_point,
        details: log.details,
        timestamp: log.timestamp.toISOString(),
      })),
      total,
      page,
      limit: take,
    };
  }

  // ─── Common Areas CRUD ──────────────────────────────────────────────────

  async listCommonAreas() {
    const areas = await this.prisma.commonArea.findMany({ orderBy: { name: 'asc' } });
    return { areas };
  }

  async createCommonArea(data: { name: string; description?: string; capacity?: number; rules?: string }) {
    const area = await this.prisma.commonArea.create({
      data: {
        id: require('uuid').v4(),
        name: data.name,
        description: data.description || null,
        capacity: data.capacity || 20,
        rules: data.rules || null,
      },
    });
    return area;
  }

  async updateCommonArea(id: string, data: { name?: string; description?: string; capacity?: number; rules?: string; is_active?: boolean }) {
    const existing = await this.prisma.commonArea.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Área não encontrada.');

    return this.prisma.commonArea.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.rules !== undefined && { rules: data.rules }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });
  }

  async deleteCommonArea(id: string) {
    const existing = await this.prisma.commonArea.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Área não encontrada.');
    await this.prisma.commonArea.delete({ where: { id } });
    return { deleted: true };
  }
}

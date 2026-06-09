import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class ResidentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  // ─── Profile ─────────────────────────────────────────────────────────

  async getProfile(residentId: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      select: { id: true, name: true, email: true, phone: true, apartment_number: true, block: true },
    });
    if (!resident) throw new NotFoundException('Morador não encontrado.');
    return resident;
  }

  // ─── Dashboard ──────────────────────────────────────────────────────────

  async getDashboard(residentId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const visits = await this.prisma.visit.findMany({
      where: {
        resident_id: residentId,
        created_at: { gte: sevenDaysAgo },
      },
    });

    const approved = visits.filter((v) => v.status === 'approved').length;
    const denied = visits.filter((v) => v.status === 'denied').length;
    const pending = visits.filter((v) => v.status === 'pending').length;

    const logs = await this.prisma.accessLog.findMany({
      where: {
        user_id: residentId,
        user_type: 'resident',
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    return {
      approved,
      denied,
      pending,
      logs: logs.map((log) => ({
        id: log.id,
        visitor_name: log.details || 'Visitante',
        date: log.timestamp.toISOString().split('T')[0],
        time: log.timestamp.toISOString().split('T')[1].slice(0, 8),
        method: log.action_type,
        access_point: log.access_point,
      })),
    };
  }

  // ─── Invites ────────────────────────────────────────────────────────────

  async createInvite(residentId: string, dto: CreateInviteDto) {
    if (!dto.visitor_name || dto.visitor_name.trim().length < 1 || dto.visitor_name.trim().length > 100) {
      throw new UnprocessableEntityException('visitor_name deve ter entre 1 e 100 caracteres.');
    }

    const validUntil = new Date(dto.valid_until);
    const minDate = new Date(Date.now() + 60_000);
    if (isNaN(validUntil.getTime()) || validUntil <= minDate) {
      throw new UnprocessableEntityException('valid_until deve ser pelo menos 1 minuto no futuro.');
    }

    const token = uuidv4();

    const visit = await this.prisma.visit.create({
      data: {
        id: uuidv4(),
        resident_id: residentId,
        status: 'pending',
        valid_until: validUntil,
        invite_link_token: token,
        visitor_name: dto.visitor_name.trim(),
      },
    });

    return {
      invite_link: `/visitor/${token}`,
      token,
      visit_id: visit.id,
    };
  }

  async getInvites(residentId: string, page: number = 1, limit: number = 20) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.visit.findMany({
        where: { resident_id: residentId },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.visit.count({ where: { resident_id: residentId } }),
    ]);

    return {
      items: items.map((v) => ({
        id: v.id,
        visitor_name: v.visitor_name,
        status: v.status,
        valid_until: v.valid_until.toISOString(),
        invite_link_token: v.invite_link_token,
        created_at: v.created_at.toISOString(),
      })),
      total,
      page,
    };
  }

  // ─── Common Areas & Reservations ────────────────────────────────────────

  async getCommonAreas() {
    const areas = await this.prisma.commonArea.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
    return { areas };
  }

  async getReservations(residentId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { resident_id: residentId },
      include: { common_area: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 20,
    });
    return {
      reservations: reservations.map((r) => ({
        id: r.id,
        area_name: r.common_area.name,
        date: r.date.toISOString().split('T')[0],
        start_time: r.start_time,
        end_time: r.end_time,
        status: r.status,
        notes: r.notes,
      })),
    };
  }

  async createReservation(residentId: string, data: { common_area_id: string; date: string; start_time: string; end_time: string; notes?: string }) {
    // Check if area exists
    const area = await this.prisma.commonArea.findUnique({ where: { id: data.common_area_id } });
    if (!area) throw new NotFoundException('Área comum não encontrada.');

    // Check for conflicts on same date/time
    const conflicting = await this.prisma.reservation.findFirst({
      where: {
        common_area_id: data.common_area_id,
        date: new Date(data.date),
        status: 'confirmed',
        OR: [
          { start_time: { lte: data.end_time }, end_time: { gte: data.start_time } },
        ],
      },
    });

    if (conflicting) {
      throw new ConflictException('Já existe uma reserva confirmada para este horário.');
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        id: uuidv4(),
        common_area_id: data.common_area_id,
        resident_id: residentId,
        date: new Date(data.date),
        start_time: data.start_time,
        end_time: data.end_time,
        status: 'confirmed',
        notes: data.notes || null,
      },
      include: { common_area: { select: { name: true } } },
    });

    return {
      id: reservation.id,
      area_name: reservation.common_area.name,
      date: reservation.date.toISOString().split('T')[0],
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      status: reservation.status,
    };
  }

  // ─── Call Concierge ────────────────────────────────────────────────────

  async callConcierge(residentId: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      select: { name: true, apartment_number: true, block: true },
    });

    if (!resident) throw new NotFoundException('Morador não encontrado.');

    // Emit intercom call event to all concierges
    this.eventsService.emitToConcierge('intercom_call', {
      access_point_id: 'app_morador',
      caller_info: `${resident.name} — Bl. ${resident.block} Ap. ${resident.apartment_number}`,
    });

    return { success: true, message: 'Chamada enviada para a portaria.' };
  }

  // ─── Approve/Deny ──────────────────────────────────────────────────────

  async getPendingVisitors(residentId: string) {
    const visits = await this.prisma.visit.findMany({
      where: {
        resident_id: residentId,
        status: 'pending',
        visitor_id: { not: null },
      },
      include: { visitor: true },
      orderBy: { created_at: 'desc' },
    });

    return {
      visitors: visits.map((v) => ({
        visit_id: v.id,
        visitor_name: v.visitor?.name || v.visitor_name,
        thumbnail_url: v.visitor?.face_encoding_url || '',
      })),
    };
  }

  async approveVisit(residentId: string, visitId: string): Promise<{ status: string; visit_id: string }> {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: { resident: true },
    });

    if (!visit) {
      throw new NotFoundException('Visita não encontrada');
    }

    if (visit.resident_id !== residentId) {
      throw new ForbiddenException('Esta visita não pertence ao morador autenticado');
    }

    if (visit.status !== 'pending') {
      throw new ConflictException('Apenas visitas com status pendente podem ser aprovadas');
    }

    await this.prisma.visit.update({
      where: { id: visitId },
      data: { status: 'approved' },
    });

    const accessLog = await this.prisma.accessLog.create({
      data: {
        id: uuidv4(),
        user_id: residentId,
        user_type: 'resident',
        action_type: 'visit_approved',
        access_point: 'portaria',
        details: visit.visitor_name,
      },
    });

    this.eventsService.emitToConcierge('visit_approved', {
      visitor_name: visit.visitor_name,
      resident_name: visit.resident?.name ?? '',
      visit_id: visitId,
    });

    this.eventsService.emitToResident(residentId, 'access_log_updated', {
      log_entry: {
        id: accessLog.id,
        visitor_name: visit.visitor_name,
        date: accessLog.timestamp.toISOString().split('T')[0],
        time: accessLog.timestamp.toISOString().split('T')[1].slice(0, 8),
        method: 'portaria',
        access_point: accessLog.access_point,
      },
    });

    return { status: 'approved', visit_id: visitId };
  }

  async denyVisit(residentId: string, visitId: string): Promise<{ status: string; visit_id: string }> {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: { resident: true },
    });

    if (!visit) {
      throw new NotFoundException('Visita não encontrada');
    }

    if (visit.resident_id !== residentId) {
      throw new ForbiddenException('Esta visita não pertence ao morador autenticado');
    }

    if (visit.status !== 'pending') {
      throw new ConflictException('Apenas visitas com status pendente podem ser recusadas');
    }

    await this.prisma.visit.update({
      where: { id: visitId },
      data: { status: 'denied' },
    });

    const accessLog = await this.prisma.accessLog.create({
      data: {
        id: uuidv4(),
        user_id: residentId,
        user_type: 'resident',
        action_type: 'visit_denied',
        access_point: 'portaria',
        details: visit.visitor_name,
      },
    });

    this.eventsService.emitToConcierge('visit_denied', {
      visitor_name: visit.visitor_name,
      resident_name: visit.resident?.name ?? '',
      visit_id: visitId,
    });

    this.eventsService.emitToResident(residentId, 'access_log_updated', {
      log_entry: {
        id: accessLog.id,
        visitor_name: visit.visitor_name,
        date: accessLog.timestamp.toISOString().split('T')[0],
        time: accessLog.timestamp.toISOString().split('T')[1].slice(0, 8),
        method: 'portaria',
        access_point: accessLog.access_point,
      },
    });

    return { status: 'denied', visit_id: visitId };
  }
}

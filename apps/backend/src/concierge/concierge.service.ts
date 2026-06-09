import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { ActionDto } from './dto/action.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * ConciergeService — handles quick actions from the concierge dashboard.
 * Actions: open_main_gate, open_block_door, entry_release, call_resident, panic
 */
@Injectable()
export class ConciergeService {
  private readonly logger = new Logger(ConciergeService.name);

  /** Simulated hardware response time threshold (ms) */
  private readonly HARDWARE_TIMEOUT_MS = 3000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Execute a concierge action based on action_type.
   */
  async executeAction(
    conciergeId: string,
    dto: ActionDto,
  ): Promise<{ success: boolean; timestamp: string }> {
    const { action_type, access_point_id, target_id } = dto;

    switch (action_type) {
      case 'open_main_gate':
      case 'open_block_door':
        return this.handleGateAction(conciergeId, action_type, access_point_id);

      case 'entry_release':
        return this.handleEntryRelease(conciergeId, target_id, access_point_id);

      case 'call_resident':
        return this.handleCallResident(conciergeId, target_id);

      case 'panic':
        return this.handlePanic(conciergeId);

      default:
        throw new ServiceUnavailableException('Tipo de ação desconhecido');
    }
  }

  /**
   * Handle gate open actions (open_main_gate, open_block_door).
   * Simulates hardware call — logs + returns success.
   * Creates AccessLog and emits 'gate_opened'.
   */
  private async handleGateAction(
    conciergeId: string,
    actionType: string,
    accessPointId?: string,
  ): Promise<{ success: boolean; timestamp: string }> {
    const accessPoint = accessPointId || 'portão_principal';

    // Simulate hardware call
    const hardwareSuccess = await this.simulateHardwareCall(accessPoint);

    if (!hardwareSuccess) {
      throw new ServiceUnavailableException(
        `Falha na comunicação com o controlador físico: ${accessPoint} não respondeu`,
      );
    }

    // Create AccessLog
    await this.prisma.accessLog.create({
      data: {
        id: uuidv4(),
        user_id: conciergeId,
        user_type: 'concierge',
        action_type: actionType,
        access_point: accessPoint,
        details: `Porteiro acionou ${actionType}`,
      },
    });

    const timestamp = new Date().toISOString();

    // Emit gate_opened to all concierge clients
    this.eventsService.emitToConcierge('gate_opened', {
      access_point: accessPoint,
      actor: conciergeId,
    });

    this.logger.log(
      `Gate action executed: ${actionType} at ${accessPoint} by ${conciergeId}`,
    );

    return { success: true, timestamp };
  }

  /**
   * Handle entry_release action.
   * Finds pending visitor by target_id, updates visit status to approved,
   * creates AccessLog, and emits 'gate_opened'.
   */
  private async handleEntryRelease(
    conciergeId: string,
    targetId?: string,
    accessPointId?: string,
  ): Promise<{ success: boolean; timestamp: string }> {
    if (!targetId) {
      throw new NotFoundException(
        'target_id é obrigatório para liberar entrada',
      );
    }

    const visit = await this.prisma.visit.findUnique({
      where: { id: targetId },
      include: { visitor: true },
    });

    if (!visit) {
      throw new NotFoundException('Visita não encontrada');
    }

    if (visit.status !== 'pending') {
      throw new NotFoundException(
        'Apenas visitas com status pendente podem ser liberadas',
      );
    }

    // Update visit status to approved
    await this.prisma.visit.update({
      where: { id: targetId },
      data: { status: 'approved' },
    });

    const accessPoint = accessPointId || 'portão_principal';

    // Create AccessLog
    await this.prisma.accessLog.create({
      data: {
        id: uuidv4(),
        user_id: conciergeId,
        user_type: 'concierge',
        action_type: 'entry_release',
        access_point: accessPoint,
        details: `Entrada liberada para visitante: ${visit.visitor_name}`,
      },
    });

    const timestamp = new Date().toISOString();

    // Emit gate_opened
    this.eventsService.emitToConcierge('gate_opened', {
      access_point: accessPoint,
      actor: conciergeId,
    });

    this.logger.log(
      `Entry released for visit ${targetId} by concierge ${conciergeId}`,
    );

    return { success: true, timestamp };
  }

  /**
   * Handle call_resident action.
   * Emits 'intercom_call' to the selected resident's room.
   */
  private async handleCallResident(
    conciergeId: string,
    targetId?: string,
  ): Promise<{ success: boolean; timestamp: string }> {
    if (!targetId) {
      throw new NotFoundException(
        'target_id (resident_id) é obrigatório para ligar para morador',
      );
    }

    const resident = await this.prisma.resident.findUnique({
      where: { id: targetId },
    });

    if (!resident) {
      throw new NotFoundException('Morador não encontrado');
    }

    // Create AccessLog
    await this.prisma.accessLog.create({
      data: {
        id: uuidv4(),
        user_id: conciergeId,
        user_type: 'concierge',
        action_type: 'call_resident',
        access_point: 'interfone',
        details: `Chamada para morador: ${resident.name} (${resident.apartment_number}/${resident.block})`,
      },
    });

    const timestamp = new Date().toISOString();

    // Emit intercom_call to the resident's room
    this.eventsService.emitToResident(targetId, 'intercom_call', {
      access_point_id: 'portaria',
      caller_info: `Porteiro - Portaria`,
    });

    this.logger.log(
      `Intercom call initiated to resident ${targetId} by concierge ${conciergeId}`,
    );

    return { success: true, timestamp };
  }

  /**
   * Handle panic action.
   * Emits 'panic_alert' to all clients and creates AccessLog with type 'panic'.
   */
  private async handlePanic(
    conciergeId: string,
  ): Promise<{ success: boolean; timestamp: string }> {
    // Create AccessLog with type panic
    await this.prisma.accessLog.create({
      data: {
        id: uuidv4(),
        user_id: conciergeId,
        user_type: 'concierge',
        action_type: 'panic',
        access_point: 'painel_porteiro',
        details: 'Alerta de pânico acionado',
      },
    });

    const timestamp = new Date().toISOString();

    // Emit panic_alert to ALL connected clients
    this.eventsService.emitToAll('panic_alert', {
      triggered_by: conciergeId,
    });

    this.logger.warn(`PANIC ALERT triggered by concierge ${conciergeId}`);

    return { success: true, timestamp };
  }

  /**
   * List all visitors with pending visits.
   */
  async getPendingVisitors(): Promise<{
    visitors: Array<{
      id: string;
      name: string;
      document: string;
      photo_url?: string;
      visit_id: string;
      resident_name: string;
      apartment: string;
    }>;
  }> {
    const pendingVisits = await this.prisma.visit.findMany({
      where: { status: 'pending' },
      include: {
        visitor: true,
        resident: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const visitors = pendingVisits
      .filter((visit) => visit.visitor !== null)
      .map((visit) => ({
        id: visit.visitor!.id,
        name: visit.visitor!.name,
        document: visit.visitor!.document,
        photo_url: visit.visitor!.face_encoding_url ?? undefined,
        visit_id: visit.id,
        resident_name: visit.resident?.name ?? '',
        apartment: `${visit.resident?.apartment_number ?? ''}/${visit.resident?.block ?? ''}`,
      }));

    return { visitors };
  }

  /**
   * List all residents for the concierge intercom selector.
   */
  async getResidents(): Promise<{
    residents: Array<{
      id: string;
      name: string;
      apartment_number: string;
      block: string;
    }>;
  }> {
    const residents = await this.prisma.resident.findMany({
      select: {
        id: true,
        name: true,
        apartment_number: true,
        block: true,
      },
      orderBy: [{ block: 'asc' }, { apartment_number: 'asc' }],
    });

    return { residents };
  }

  /**
   * Simulate a hardware call to a physical access point controller.
   * Returns true for success, false for failure (timeout simulation).
   * In production, this would communicate with the actual hardware controller.
   */
  private async simulateHardwareCall(accessPoint: string): Promise<boolean> {
    this.logger.debug(`Simulating hardware call to: ${accessPoint}`);

    // Simulate a short delay (hardware response)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Always succeed in simulation mode
    // In production, this would be replaced with actual hardware communication
    // and would throw ServiceUnavailableException on timeout > 3s
    return true;
  }
}

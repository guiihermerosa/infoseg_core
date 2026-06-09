import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EventsService } from '../events/events.service';
import { RegisterVisitorDto } from './dto/register-visitor.dto';
import {
  ACCEPTED_IMAGE_MIMETYPES,
  FIELD_LIMITS,
  WS_EVENTS,
} from '@infoseg/shared';
import { v4 as uuidv4 } from 'uuid';

export interface InviteStatusResponse {
  status: string;
  visitor_name: string;
  valid_until: string;
}

export interface RegisterVisitorResponse {
  success: boolean;
  visit_id: string;
}

@Injectable()
export class VisitorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Validates an invite token by checking existence, status, and expiration.
   * - 404 if token not found
   * - 409 if invite already used (status !== 'pending')
   * - 410 if invite expired (valid_until < now)
   */
  async validateInviteToken(token: string): Promise<InviteStatusResponse> {
    const visit = await this.prisma.visit.findUnique({
      where: { invite_link_token: token },
    });

    if (!visit) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (visit.status !== 'pending') {
      throw new ConflictException('Convite já utilizado');
    }

    if (new Date(visit.valid_until) < new Date()) {
      throw new GoneException('Convite expirado');
    }

    return {
      status: visit.status,
      visitor_name: visit.visitor_name,
      valid_until: visit.valid_until.toISOString(),
    };
  }

  /**
   * Registers a visitor with their photo.
   * - Validates the invite token (must be pending and not expired)
   * - Validates photo mimetype and size
   * - Uploads photo to storage
   * - Creates or finds Visitor record
   * - Links visitor to the Visit
   * - Emits 'visitor_registered' event to the resident's room
   */
  async registerVisitor(
    dto: RegisterVisitorDto,
    photoFile: Express.Multer.File,
  ): Promise<RegisterVisitorResponse> {
    // 1. Validate photo file
    this.validatePhoto(photoFile);

    // 2. Validate invite token internally (don't throw HTTP exceptions for flow control)
    const visit = await this.prisma.visit.findUnique({
      where: { invite_link_token: dto.token },
    });

    if (!visit) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (visit.status !== 'pending') {
      throw new ConflictException('Convite já utilizado');
    }

    if (new Date(visit.valid_until) < new Date()) {
      throw new GoneException('Convite expirado');
    }

    // 3. Upload photo via StorageService
    const filename = `visitors/${uuidv4()}-${photoFile.originalname}`;
    const photoUrl = await this.storageService.upload(
      photoFile.buffer,
      filename,
      photoFile.mimetype,
    );

    // 4. Create or find Visitor record
    let visitor = await this.prisma.visitor.findFirst({
      where: {
        name: dto.name,
        document: dto.document,
      },
    });

    if (visitor) {
      // Update existing visitor with new face encoding URL
      visitor = await this.prisma.visitor.update({
        where: { id: visitor.id },
        data: { face_encoding_url: photoUrl },
      });
    } else {
      // Create new visitor
      visitor = await this.prisma.visitor.create({
        data: {
          id: uuidv4(),
          name: dto.name,
          document: dto.document,
          face_encoding_url: photoUrl,
        },
      });
    }

    // 5. Update Visit: set visitor_id, keep status 'pending'
    await this.prisma.visit.update({
      where: { id: visit.id },
      data: { visitor_id: visitor.id },
    });

    // 6. Emit 'visitor_registered' to the resident's room
    this.eventsService.emitToResident(visit.resident_id, WS_EVENTS.VISITOR_REGISTERED, {
      visitor_name: dto.name,
      thumbnail_url: photoUrl,
      visit_id: visit.id,
    });

    return {
      success: true,
      visit_id: visit.id,
    };
  }

  /**
   * Validates the uploaded photo file for mimetype and size.
   * Throws BadRequestException for invalid format or PayloadTooLargeException for oversized files.
   */
  private validatePhoto(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Foto é obrigatória');
    }

    const allowedMimetypes: readonly string[] = ACCEPTED_IMAGE_MIMETYPES;

    if (!allowedMimetypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Formato de imagem inválido. Formatos aceitos: JPEG, PNG, WebP`,
      );
    }

    if (file.size > FIELD_LIMITS.IMAGE_MAX_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        'Tamanho máximo da imagem é 10 MB',
      );
    }
  }
}

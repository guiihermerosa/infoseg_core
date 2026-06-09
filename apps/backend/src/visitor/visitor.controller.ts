import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisitorService, InviteStatusResponse, RegisterVisitorResponse } from './visitor.service';
import { RegisterVisitorDto } from './dto/register-visitor.dto';

@Controller('visitor')
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  /**
   * GET /visitor/invite/:token
   * Public endpoint (no auth guard) — validates an invite token.
   * Returns InviteStatusDto with status, visitor_name, and valid_until.
   */
  @Get('invite/:token')
  async getInviteStatus(
    @Param('token') token: string,
  ): Promise<InviteStatusResponse> {
    return this.visitorService.validateInviteToken(token);
  }

  /**
   * POST /visitor/register
   * Public endpoint — multipart form data with photo upload.
   * Accepts: name, document, token (text fields) + photo (file field).
   * Returns: { success: true, visit_id }
   * Errors:
   *   - 400: invalid image format or missing photo
   *   - 410: expired invite token
   *   - 409: invite already used
   *   - 413: file too large (> 10MB)
   */
  @Post('register')
  @UseInterceptors(FileInterceptor('photo'))
  async registerVisitor(
    @Body() dto: RegisterVisitorDto,
    @UploadedFile() photo: Express.Multer.File,
  ): Promise<RegisterVisitorResponse> {
    if (!photo) {
      throw new BadRequestException('Foto é obrigatória');
    }

    return this.visitorService.registerVisitor(dto, photo);
  }
}

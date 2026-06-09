import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CameraService } from './camera.service';
import { CameraPtzService } from './camera-ptz.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { PtzCommandDto } from './dto/ptz-command.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * CameraController — CRUD, streaming, and PTZ endpoints.
 * All endpoints protected with JwtAuthGuard + RolesGuard('concierge').
 *
 * Requirements: 7.1, 7.4, 8.2, 11.1-11.6
 */
@Controller('concierge/cameras')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('concierge')
export class CameraController {
  constructor(
    private readonly cameraService: CameraService,
    private readonly cameraPtzService: CameraPtzService,
  ) {}

  /**
   * GET /concierge/cameras
   * List all cameras (paginated, no credentials in response).
   * Requirement 11.5
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.cameraService.findAll(pageNum, limitNum);
  }

  /**
   * POST /concierge/cameras
   * Create a new camera.
   * Requirements: 11.1, 11.2, 11.3, 11.6
   */
  @Post()
  async create(@Body() dto: CreateCameraDto) {
    return this.cameraService.create(dto);
  }

  /**
   * PUT /concierge/cameras/:id
   * Update an existing camera.
   * Requirements: 11.2, 11.3, 11.6
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCameraDto) {
    return this.cameraService.update(id, dto);
  }

  /**
   * DELETE /concierge/cameras/:id
   * Delete a camera.
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.cameraService.delete(id);
  }

  /**
   * GET /concierge/cameras/:id/stream
   * Get the stream URL for a camera.
   * Returns { stream_url: '/cam-{id}', protocol: 'whep' }
   * Requirement 7.4
   */
  @Get(':id/stream')
  async getStream(@Param('id') id: string) {
    return this.cameraService.getStreamUrl(id);
  }

  /**
   * POST /concierge/cameras/:id/ptz
   * Send a PTZ command to a camera.
   * Requirements: 8.1, 8.2, 8.4
   */
  @Post(':id/ptz')
  async sendPtzCommand(
    @Param('id') id: string,
    @Body() dto: PtzCommandDto,
  ) {
    return this.cameraPtzService.sendCommand(id, dto.command);
  }
}

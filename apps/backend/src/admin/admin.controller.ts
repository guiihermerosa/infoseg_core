import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AdminService,
  SystemConfig,
  CreateResidentDto,
  UpdateResidentDto,
  CreateConciergeDto,
  UpdateConciergeDto,
  UserListItem,
} from './admin.service';
import { AccessPointService, CreateAccessPointDto, UpdateAccessPointDto } from './access-point.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * AdminController — System configuration, stats, and user management.
 * Protected for concierge role.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('concierge')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly accessPointService: AccessPointService,
  ) {}

  // ─── System Config ──────────────────────────────────────────────────────

  @Get('config')
  getConfig(): SystemConfig {
    return this.adminService.getSystemConfig();
  }

  @Put('config')
  updateConfig(@Body() body: Partial<SystemConfig>): SystemConfig {
    return this.adminService.updateSystemConfig(body);
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getSystemStats();
  }

  // ─── User Management ───────────────────────────────────────────────────

  @Get('users')
  async listUsers(): Promise<UserListItem[]> {
    return this.adminService.listAllUsers();
  }

  // ─── Residents ──────────────────────────────────────────────────────────

  @Post('residents')
  async createResident(@Body() dto: CreateResidentDto) {
    return this.adminService.createResident(dto);
  }

  @Put('residents/:id')
  async updateResident(@Param('id') id: string, @Body() dto: UpdateResidentDto) {
    return this.adminService.updateResident(id, dto);
  }

  @Delete('residents/:id')
  async deleteResident(@Param('id') id: string) {
    return this.adminService.deleteResident(id);
  }

  // ─── Concierges ─────────────────────────────────────────────────────────

  @Post('concierges')
  async createConcierge(@Body() dto: CreateConciergeDto) {
    return this.adminService.createConcierge(dto);
  }

  @Put('concierges/:id')
  async updateConcierge(@Param('id') id: string, @Body() dto: UpdateConciergeDto) {
    return this.adminService.updateConcierge(id, dto);
  }

  @Delete('concierges/:id')
  async deleteConcierge(@Param('id') id: string) {
    return this.adminService.deleteConcierge(id);
  }

  // ─── System Logs ────────────────────────────────────────────────────────

  @Get('logs')
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adminService.getSystemLogs(pageNum, limitNum, type);
  }

  // ─── Access Points (Relays/Gates) ──────────────────────────────────────

  @Get('access-points')
  async listAccessPoints() {
    return this.accessPointService.findAll();
  }

  @Post('access-points')
  async createAccessPoint(@Body() dto: CreateAccessPointDto) {
    return this.accessPointService.create(dto);
  }

  @Put('access-points/:id')
  async updateAccessPoint(@Param('id') id: string, @Body() dto: UpdateAccessPointDto) {
    return this.accessPointService.update(id, dto);
  }

  @Delete('access-points/:id')
  async deleteAccessPoint(@Param('id') id: string) {
    return this.accessPointService.delete(id);
  }

  @Post('access-points/:id/trigger')
  async triggerAccessPoint(@Param('id') id: string) {
    return this.accessPointService.trigger(id);
  }

  // ─── Common Areas (Reservable Spaces) ──────────────────────────────────

  @Get('common-areas')
  async listCommonAreas() {
    return this.adminService.listCommonAreas();
  }

  @Post('common-areas')
  async createCommonArea(@Body() body: { name: string; description?: string; capacity?: number; rules?: string }) {
    return this.adminService.createCommonArea(body);
  }

  @Put('common-areas/:id')
  async updateCommonArea(@Param('id') id: string, @Body() body: { name?: string; description?: string; capacity?: number; rules?: string; is_active?: boolean }) {
    return this.adminService.updateCommonArea(id, body);
  }

  @Delete('common-areas/:id')
  async deleteCommonArea(@Param('id') id: string) {
    return this.adminService.deleteCommonArea(id);
  }
}

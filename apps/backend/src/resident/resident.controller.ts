import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ResidentService } from './resident.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller('resident')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('resident')
export class ResidentController {
  constructor(private readonly residentService: ResidentService) {}

  /**
   * GET /resident/me
   * Returns the authenticated resident's profile info.
   */
  @Get('me')
  async getProfile(@Req() req: any) {
    const residentId: string = req.user.userId;
    return this.residentService.getProfile(residentId);
  }

  /**
   * GET /resident/dashboard
   */
  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const residentId: string = req.user.userId;
    return this.residentService.getDashboard(residentId);
  }

  /**
   * POST /resident/invite
   */
  @Post('invite')
  async createInvite(@Req() req: any, @Body() dto: CreateInviteDto) {
    const residentId: string = req.user.userId;
    return this.residentService.createInvite(residentId, dto);
  }

  /**
   * GET /resident/invites
   */
  @Get('invites')
  async getInvites(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    const residentId: string = req.user.userId;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.residentService.getInvites(residentId, pageNum, limitNum);
  }

  /**
   * GET /resident/pending-visitors
   */
  @Get('pending-visitors')
  async getPendingVisitors(@Req() req: any) {
    const residentId: string = req.user.userId;
    return this.residentService.getPendingVisitors(residentId);
  }

  /**
   * GET /resident/common-areas
   * Lists available common areas for reservation.
   */
  @Get('common-areas')
  async getCommonAreas() {
    return this.residentService.getCommonAreas();
  }

  /**
   * GET /resident/reservations
   * Lists the resident's reservations.
   */
  @Get('reservations')
  async getReservations(@Req() req: any) {
    const residentId: string = req.user.userId;
    return this.residentService.getReservations(residentId);
  }

  /**
   * POST /resident/reservations
   * Creates a new reservation.
   */
  @Post('reservations')
  async createReservation(@Req() req: any, @Body() body: { common_area_id: string; date: string; start_time: string; end_time: string; notes?: string }) {
    const residentId: string = req.user.userId;
    return this.residentService.createReservation(residentId, body);
  }

  /**
   * POST /resident/call-concierge
   * Initiates a call to the online concierge.
   */
  @Post('call-concierge')
  async callConcierge(@Req() req: any) {
    const residentId: string = req.user.userId;
    return this.residentService.callConcierge(residentId);
  }

  @Post('visit/:id/approve')
  async approveVisit(@Param('id') visitId: string, @Req() req: any) {
    const residentId: string = req.user.userId;
    return this.residentService.approveVisit(residentId, visitId);
  }

  @Post('visit/:id/deny')
  async denyVisit(@Param('id') visitId: string, @Req() req: any) {
    const residentId: string = req.user.userId;
    return this.residentService.denyVisit(residentId, visitId);
  }
}

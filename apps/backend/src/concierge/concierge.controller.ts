import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ConciergeService } from './concierge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ActionDto } from './dto/action.dto';

/**
 * ConciergeController — handles concierge quick actions and auxiliary endpoints.
 * All endpoints protected with JwtAuthGuard + RolesGuard('concierge').
 */
@Controller('concierge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('concierge')
export class ConciergeController {
  constructor(private readonly conciergeService: ConciergeService) {}

  /**
   * POST /concierge/action
   * Executes a concierge quick action (open gate, panic, entry release, call resident).
   */
  @Post('action')
  async executeAction(
    @Body() dto: ActionDto,
    @Req() req: any,
  ): Promise<{ success: boolean; timestamp: string }> {
    const conciergeId: string = req.user.userId;
    return this.conciergeService.executeAction(conciergeId, dto);
  }

  /**
   * GET /concierge/visitors/pending
   * Lists all visitors with pending visits for the concierge entry release selector.
   */
  @Get('visitors/pending')
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
    return this.conciergeService.getPendingVisitors();
  }

  /**
   * GET /concierge/residents
   * Lists all residents for the concierge intercom call selector.
   */
  @Get('residents')
  async getResidents(): Promise<{
    residents: Array<{
      id: string;
      name: string;
      apartment_number: string;
      block: string;
    }>;
  }> {
    return this.conciergeService.getResidents();
  }
}

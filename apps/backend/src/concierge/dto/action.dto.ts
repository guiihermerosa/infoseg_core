import { IsString, IsOptional, IsIn } from 'class-validator';

/**
 * DTO for POST /concierge/action
 * Validates action request from concierge quick action panel.
 */
export class ActionDto {
  @IsString()
  @IsIn(['open_main_gate', 'open_block_door', 'entry_release', 'call_resident', 'panic'])
  action_type!: string;

  @IsString()
  @IsOptional()
  access_point_id?: string;

  @IsString()
  @IsOptional()
  target_id?: string;
}

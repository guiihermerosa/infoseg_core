import { IsEnum } from 'class-validator';
import { PtzCommand } from '@infoseg/shared';

/**
 * DTO for PTZ commands.
 * Validates that the command is one of the allowed values.
 */
export class PtzCommandDto {
  @IsEnum(PtzCommand, {
    message:
      'O campo command deve ser um dos valores: up, down, left, right, zoom_in, zoom_out',
  })
  command!: PtzCommand;
}

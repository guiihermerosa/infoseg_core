import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

/**
 * Pre-configured ValidationPipe for the INFOSEG CORE backend.
 * - whitelist: strips properties not decorated with class-validator decorators
 * - transform: auto-transforms payloads to DTO instances
 * - forbidNonWhitelisted: throws error when unknown properties are sent
 */
export function createValidationPipe(
  overrides?: Partial<ValidationPipeOptions>,
): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    ...overrides,
  });
}

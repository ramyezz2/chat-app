import { SetMetadata } from '@nestjs/common';

export const SkipAuth = () => SetMetadata('isAuthSkipped', true);

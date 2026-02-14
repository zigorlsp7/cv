import { Injectable } from '@nestjs/common';
import { config } from '../../config/app.config';

@Injectable()
export class FeatureFlagsService {
  isEnabled(flag: string): boolean {
    return config.features[flag] === true;
  }

  getAll(): Record<string, boolean> {
    return { ...config.features };
  }
}


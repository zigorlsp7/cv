import { Module } from '@nestjs/common';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { RumController } from './rum.controller';
import { RumService } from './rum.service';

@Module({
  imports: [FeatureFlagsModule],
  controllers: [RumController],
  providers: [RumService],
})
export class RumModule {}


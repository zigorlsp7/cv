import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { CvProfile } from './entities/cv-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CvProfile])],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}


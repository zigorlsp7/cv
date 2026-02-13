import { Module } from '@nestjs/common';
import { AsyncWorkerService } from './async.worker.service';

@Module({
  providers: [AsyncWorkerService],
  exports: [AsyncWorkerService],
})
export class AsyncModule {}

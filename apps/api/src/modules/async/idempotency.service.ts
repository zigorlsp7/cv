import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedMessage } from './entities/processed-message.entity';

type RecordProcessedInput = {
  messageId: string;
  topic: string;
  key: string | null;
};

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepo: Repository<ProcessedMessage>,
  ) {}

  async wasProcessed(messageId: string): Promise<boolean> {
    const found = await this.processedMessageRepo.exist({
      where: { messageId },
    });
    return found;
  }

  async recordProcessed(input: RecordProcessedInput): Promise<boolean> {
    try {
      await this.processedMessageRepo.insert({
        messageId: input.messageId,
        topic: input.topic,
        key: input.key,
      });
      return true;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const pgCode = (error as { code?: unknown }).code;
    return pgCode === '23505';
  }
}

import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SendContactMessageDto } from './contact.dto';
import { ContactService } from './contact.service';

@ApiTags('contact')
@Controller({ path: 'contact', version: '1' })
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Send a public contact message to the CV owner' })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        accepted: { type: 'boolean', example: true },
        messageId: {
          type: 'string',
          example: '9d6c21dc-e6f8-4be8-87a6-f5c1d8d8b8f2',
        },
      },
      required: ['accepted', 'messageId'],
    },
  })
  sendMessage(@Body() body: SendContactMessageDto, @Req() req: Request) {
    return this.contactService.sendMessage(body, {
      sourceIp: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });
  }
}

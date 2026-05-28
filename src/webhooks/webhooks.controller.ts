import { Controller, Post, Body, Get, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookSubscriptionDto } from './dto/create-webhook-subscription.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateWebhookSubscriptionDto) {
    return this.webhooksService.create(dto);
  }

  @Get()
  async list() {
    return this.webhooksService.findAll();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.webhooksService.findOne(id);
  }
}

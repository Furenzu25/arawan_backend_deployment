import { Controller, Get, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkReadDto } from './dto/mark-read.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Post('mark-read')
  markRead(@Body() dto: MarkReadDto) {
    return this.notificationsService.markRead(dto.id);
  }

  @Post('mark-all-read')
  markAllRead() {
    return this.notificationsService.markAllRead();
  }
}

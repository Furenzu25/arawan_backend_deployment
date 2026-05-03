import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { IdempotencyGuard } from '../common/guards/idempotency.guard';
import { WRITE_RATE_LIMIT } from '../config/constants';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Query('filter') filter?: string) {
    return this.paymentsService.findAll(filter ?? 'today');
  }

  @Post('collect')
  @Throttle({ default: { ttl: WRITE_RATE_LIMIT.WINDOW_MS, limit: WRITE_RATE_LIMIT.MAX_REQUESTS } })
  @UseGuards(IdempotencyGuard)
  collect(@Body() dto: CollectPaymentDto) {
    return this.paymentsService.collect(dto);
  }
}

import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CollectPaymentDto } from './dto/collect-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Query('filter') filter?: string) {
    return this.paymentsService.findAll(filter ?? 'today');
  }

  @Post('collect')
  collect(@Body() dto: CollectPaymentDto) {
    return this.paymentsService.collect(dto);
  }
}

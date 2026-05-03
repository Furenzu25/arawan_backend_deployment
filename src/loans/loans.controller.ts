import { Controller, Get, Post, Param, Body, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';
import { AgreementSignatureDto } from './dto/agreement-signature.dto';
import { IdempotencyGuard } from '../common/guards/idempotency.guard';
import { WRITE_RATE_LIMIT } from '../config/constants';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  findAll() {
    return this.loansService.findAll();
  }

  @Post()
  @Throttle({ default: { ttl: WRITE_RATE_LIMIT.WINDOW_MS, limit: WRITE_RATE_LIMIT.MAX_REQUESTS } })
  @UseGuards(IdempotencyGuard)
  create(@Body() dto: CreateLoanDto) {
    return this.loansService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.loansService.findOne(id);
  }

  @Post(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanStatusDto,
  ) {
    return this.loansService.updateStatus(id, dto.status);
  }

  @Post(':id/agreement-signature')
  uploadSignature(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgreementSignatureDto,
  ) {
    return this.loansService.uploadAgreementSignature(id, dto);
  }
}

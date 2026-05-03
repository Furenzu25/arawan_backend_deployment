import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ReportsService } from './reports.service';
import { CACHE_TTL } from '../config/constants';

@Controller('reports')
@UseInterceptors(CacheInterceptor)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @CacheTTL(CACHE_TTL.REPORTS_MS)
  getReport(
    @Query('type') type?: string,
    @Query('date') date?: string,
  ) {
    const today = new Date();
    const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return this.reportsService.getReport(type ?? 'daily', date ?? defaultDate);
  }
}

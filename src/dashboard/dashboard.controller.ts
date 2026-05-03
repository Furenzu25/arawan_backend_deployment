import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { CACHE_TTL } from '../config/constants';

@Controller('dashboard')
@UseInterceptors(CacheInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @CacheTTL(CACHE_TTL.DASHBOARD_MS)
  getDashboard() {
    return this.dashboardService.getDashboard();
  }
}

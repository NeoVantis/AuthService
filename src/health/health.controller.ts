import { Controller, Get, Version } from '@nestjs/common';
import { HealthService, SystemMetrics } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version('1')
  async getDetailedHealth(): Promise<SystemMetrics> {
    return this.healthService.getSystemHealth();
  }

  @Get('simple')
  @Version('1')
  async getSimpleHealth(): Promise<{ status: string; timestamp: string }> {
    return this.healthService.getSimpleHealth();
  }
}

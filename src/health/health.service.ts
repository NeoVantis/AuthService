import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as os from 'os';
import * as process from 'process';

export interface SystemMetrics {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    process: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
  };
  cpu: {
    cores: number;
    loadAverage: number[];
    model: string;
    speed: number;
  };
  database: {
    status: string;
    responseTime: number;
    error?: string;
  };
  network: {
    hostname: string;
    platform: string;
    arch: string;
  };
}

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getSystemHealth(): Promise<SystemMetrics> {
    const startTime = Date.now();

    // Test database connection
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    let dbError: string | undefined;

    try {
      const dbStart = Date.now();
      await this.dataSource.query('SELECT 1');
      dbResponseTime = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'unhealthy';
      dbError =
        error instanceof Error ? error.message : 'Unknown database error';
      dbResponseTime = Date.now() - startTime;
    }

    // Get memory info
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Get process memory
    const processMemory = process.memoryUsage();

    // Get CPU info
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: {
        total: Math.round(totalMemory / 1024 / 1024), // MB
        free: Math.round(freeMemory / 1024 / 1024), // MB
        used: Math.round(usedMemory / 1024 / 1024), // MB
        usagePercent: Math.round(memoryUsagePercent * 100) / 100,
        process: {
          heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024), // MB
          external: Math.round(processMemory.external / 1024 / 1024), // MB
          rss: Math.round(processMemory.rss / 1024 / 1024), // MB
        },
      },
      cpu: {
        cores: cpus.length,
        loadAverage: loadAvg.map((avg) => Math.round(avg * 100) / 100),
        model: cpus[0]?.model || 'Unknown',
        speed: cpus[0]?.speed || 0,
      },
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
        ...(dbError && { error: dbError }),
      },
      network: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
      },
    };
  }

  async getSimpleHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

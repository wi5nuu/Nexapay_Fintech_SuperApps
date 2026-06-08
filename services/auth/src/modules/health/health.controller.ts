import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    };
  }
}

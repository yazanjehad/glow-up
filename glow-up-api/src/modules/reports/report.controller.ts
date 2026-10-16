import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('stats/site')
  @ApiOperation({ summary: 'Get overall site statistics' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        newUsersLastMonth: { type: 'number' },
        totalServiceProviders: { type: 'number' },
        totalAppointments: { type: 'number' },
      },
    },
  })
  async getSiteStats() {
    return this.reportService.getSiteStats();
  }
}
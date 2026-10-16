import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleType } from 'src/common/enum/roletype.enum';
import { AuditService } from './audit.service';
import { AuditLog } from './schemas/audit-log.schema';
import { GetAuditLogsDto } from './dto/GetAuditLogs.dto';

@ApiTags('Audit')
@ApiBearerAuth('access-token')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}


    @Get()
    @ApiOperation({ summary: 'Get audit logs with optional filters' })
    @ApiOkResponse({ description: 'List of audit logs', type: [AuditLog] })
    async getAuditLogs(@Query() filters: GetAuditLogsDto) {
    return this.auditService.getFilteredLogs(filters);
    }
}

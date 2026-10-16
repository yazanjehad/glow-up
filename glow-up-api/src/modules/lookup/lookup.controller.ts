import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ForbiddenException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LookupService } from './lookup.service';
import { CreateLookupDto } from './dto/create-lookup.dto';
import { UpdateLookupDto } from './dto/update-lookup.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RoleType } from 'src/common/enum/roletype.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { GetLookupsFilterDto } from './dto/get-lookups-filter.dto';
import { Lookup } from './schemas/lookup.schema';
import { Audit } from '../audit/audit.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
@ApiTags('Lookups')
@Controller('lookups')
@ApiBearerAuth('access-token')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
@Roles(RoleType.ADMIN, RoleType.PROVIDER)
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Post()
  @Audit('Create Lookup')
 
  create(@Body() dto: CreateLookupDto) {
    //to do
    //    if (
    //   user.role === Role.PROVIDER &&
    //   !['SERVICE_TAG', 'CUSTOM_SERVICE_TYPE'].includes(dto.key)
    // ) {
    //   throw new ForbiddenException(
    //     'You are not allowed to manage this lookup type',
    //   );
    // }
    return this.lookupService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Lookups' ,description: 'Get all Lookups by key( PROVIDER_TYPE or SERVICE_TYPE or EMPLOYEE_POSITION ,SERVICE_CATEGORY)' })
  findAll(
    @Query('key') key?: string,
    @Query('activeOnly') activeOnly = 'true',
  ) {
    return this.lookupService.findAll(key, activeOnly === 'true');
  }

  @Get('all')
  @Public()
  @ApiOperation({ summary: 'Get all Lookups with pagination' })
  getAllLookups(@Query() query: GetLookupsFilterDto) {
    return this.lookupService.getAllLookups(query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.lookupService.findOne(id);
  }

  @Patch(':id')
  @Audit('Update Lookup')
  update(@Param('id') id: string, @Body() dto: UpdateLookupDto) {
    //to do
    //    if (
    //   user.role === Role.PROVIDER &&
    //   !['SERVICE_TAG', 'CUSTOM_SERVICE_TYPE'].includes(dto.key)
    // ) {
    //   throw new ForbiddenException(
    //     'You are not allowed to manage this lookup type',
    //   );
    // }
    return this.lookupService.update(id, dto);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.lookupService.remove(id);
  // }


}

import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserPackageService } from './user-package.service';
import { UserPackage } from './schemas/user-package.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RoleType } from 'src/common/enum/roletype.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateUserPackageDto } from './dto/create-user-package.dto';
import { UserPackageResponseDto } from './dto/user-package.response.dto';
import { Audit } from '../audit/audit.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { PreviewPackageDto } from './dto/preview-package.dto';
import { PreviewPackageResponseDto } from './dto/preview-package-response.dto';
@ApiTags('User Packages')

@Controller('user-packages')

export class UserPackageController {
  constructor(private readonly userPackageService: UserPackageService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @ApiBearerAuth('access-token')
  @Post('purchase')
  @Audit('Purchase Package')
  @ApiOperation({ summary: 'Purchase package' })
  @ApiResponse({
    status: 201,
    type: UserPackageResponseDto,
  })
  purchasePackage(@Req() req, @Body() dto: CreateUserPackageDto): Promise<UserPackageResponseDto> {
    const userId = req.user.userId;
    return this.userPackageService.purchasePackage(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(RoleType.CUSTOMER)
  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Get my packages' })
  @ApiResponse({
    status: 200,
    type: [UserPackageResponseDto],
  })
  findAll(@Req() req) {
    return this.userPackageService.findAll(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(RoleType.CUSTOMER)
  @ApiBearerAuth('access-token')
  @Get('me/:id')
  @ApiOperation({ summary: 'Get package by id' })
  @ApiResponse({
    status: 200,
    type: UserPackageResponseDto,
  })
  findOne(@Param('id') id: string, @Req() req) {
    return this.userPackageService.findById(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(RoleType.CUSTOMER)
  @ApiBearerAuth('access-token')
  @Get('me/service-item/:serviceItemId')
  @ApiOperation({ summary: 'Get packages by service item' })
  @ApiResponse({
    status: 200,
    type: [UserPackageResponseDto],
  })
  findByServiceItem(
    @Param('serviceItemId') serviceItemId: string,
    @Req() req,
  ) {
    return this.userPackageService.findByServiceItemId(
      serviceItemId,
      req.user.userId,
    );
  }
 @UseGuards(JwtAuthGuard)
  @Roles(RoleType.CUSTOMER)
   @ApiBearerAuth('access-token')
  @Post('check')
  @ApiBody({ type: PreviewPackageDto })
  @ApiOperation({ summary: 'Check if services are covered by user package' })
@ApiOkResponse({
  type: PreviewPackageResponseDto,
})
  checkServicesPackage(
  @Body() dto: PreviewPackageDto,
  @Req() req,
) {
  return this.userPackageService.checkPackage(dto, req.user.userId);
}
}

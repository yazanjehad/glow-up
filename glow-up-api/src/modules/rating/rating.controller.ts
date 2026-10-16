import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import express from 'express';

import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';


import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleType } from 'src/common/enum/roletype.enum';
import { Types } from 'mongoose';
import { Public } from 'src/common/decorators/public.decorator';
import { GetRatingsPaginatedResponseDto, GetRatingsQueryDto, ProviderRatingsResponseDto, RatingResponseDto } from './dto/provider-rating-response.dto';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PermissionType } from 'src/common/enum/permission.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
@ApiTags('Ratings')
@ApiHeader({
  name: 'Accept-Language',
  description: 'Language (ar | en)',
  required: false,
  schema: {
    type: 'string',
    default: 'ar',
    enum: ['ar', 'en'],
  },
})
@ApiBearerAuth('access-token')
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) { }

  // =========================
  // Create Rating (Customer only)
  // =========================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @ApiTags('Ratings')
  @Post()
  @ApiOperation({
    summary: 'Create rating for a completed appointment (Customer only)',
  })

  @ApiBody({ type: CreateRatingDto })
  create(@Req() req: express.Request, @Body() dto: CreateRatingDto) {
    return this.ratingService.create((req.user as any).userId, dto);
  }

  // =========================
  // Get All Provider Ratings (Admin/Super Admin)
  // =========================
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.VIEW_RATINGS)
  @Get('providers')
  @ApiOperation({
    summary: 'Get all service provider ratings with pagination and filters',
  })
  @ApiOkResponse({ type: GetRatingsPaginatedResponseDto })
  getAllProviderRatings(
    @Query() query: GetRatingsQueryDto,
  ): Promise<GetRatingsPaginatedResponseDto> {
    return this.ratingService.getAllProviderRatings(query);
  }
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.DELETE_RATING)
  @Patch(':id/delete')
  @ApiOperation({
    summary: 'Admin deletes (soft delete) a rating comment',
  })
  DeleteRating(@Param('id') id: string) {
    return this.ratingService.DeleteRating(id);
  }

  @Public()
  @Get('public/provider/:providerId')
  @ApiOperation({
    summary: 'Get ratings for a specific provider (Public)',
  })
  @ApiOkResponse({ type: ProviderRatingsResponseDto, isArray: true })
  async getRatingsByProvider(
    @Param('providerId') providerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.ratingService.getRatingsByProvider(
      new Types.ObjectId(providerId),
      page,
      limit,
    );
  }
  // =========================
  // Get Provider Ratings by ProviderId (Admin/Super Admin)
  // =========================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER)
  @Get('provider/:providerId') // route for ratings by {providerId}
  @ApiOperation({
    summary: 'Get ratings for a specific provider (Provider)',
  })
  @ApiOkResponse({ type: RatingResponseDto, isArray: true })
  getProviderRatings(
    @Param('providerId') providerId: string,
  ): Promise<RatingResponseDto[]> {
    return this.ratingService.getProviderRatings(providerId);

  }
  // =========================
  // Get Employee Ratings (Public)
  // =========================
  @Public()
  @Get('public/employee/:employeeId')
  @ApiOperation({
    summary: 'Get detailed ratings for an employee (reviews, average, distribution)',
  })
  async getEmployeeRatingsDetailed(
    @Param('employeeId') employeeId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.ratingService.getEmployeeRatingsDetailed(
      new Types.ObjectId(employeeId),
      page,
      limit,
    );
  }
}

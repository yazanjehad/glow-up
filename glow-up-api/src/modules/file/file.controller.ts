import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  BadRequestException,
  UseGuards,
  Get,
  Param,
  Res,
  Query,
  UseFilters,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { FileCategory, FileEntityType, UploadFileDto } from './dto/uploadfile.dto';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request, Response, Express } from 'express';
import { MulterExceptionFilter } from 'src/common/filters/multer-exception.filter';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleType } from 'src/common/enum/roletype.enum';



@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  
  @Post('upload')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UseFilters(MulterExceptionFilter)

@UseInterceptors(
  FileInterceptor('file', {
    storage: memoryStorage(),

    limits: {
      fileSize: 500 * 1024,// 500k
    },

    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/jpg',
        'image/gif',
        'image/svg+xml',
        'image/heic',
        'image/heif',
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            'Only image (jpg, png, webp, gif, svg, heic) are allowed',
          ),
          false,
        );
      }

      cb(null, true);
    },
  }),
)
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    required: ['file', 'entityType', 'fileCategory'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
      entityType: {
        type: 'string',
        enum: Object.values(FileEntityType),
      },
      entityId: {
        type: 'string',
      },
      fileCategory: {
        type: 'string',
        enum: Object.values(FileCategory),
      },
    },
  },
})
async upload(
  @Body() dto: UploadFileDto,
  @UploadedFile() file: Express.Multer.File,
  @Req() req,
) {
  if (!file) {
    throw new BadRequestException('common.errors.FILE_REQUIRED');
  }

  return this.fileService.upload(dto, file, req.user.sub);
}


@Delete('provider-file')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.PROVIDER)
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      providerId: { type: 'string' },
      fileCategory: { type: 'string', enum: ['gallery', 'document'] },
      blobPath: { type: 'string' },
    },
    required: ['providerId', 'fileCategory', 'blobPath'],
  },
})
async deleteProviderFile(
  @Body()
  body: {
    providerId: string;
    fileCategory: FileCategory;
    blobPath: string;
  },
  @Req() req,
) {
  
  return this.fileService.deleteProviderFile(
    body.providerId,
    body.fileCategory,
    body.blobPath,
    req.user.sub,
  );
}

@Get('public')
async getPublicImage(
  @Query('path') path: string,
  @Res() res: Response,
) {
  console.log("path",path);
  const { stream, contentType } =
    await this.fileService.getPublicImage(path);

  res.set({
    'Content-Type': contentType || 'image/jpeg',
    'Cache-Control': 'public, max-age=86400',
  });

  stream.pipe(res);
}

}

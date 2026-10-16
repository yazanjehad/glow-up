import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAdDto } from '../ads/dto/create-ad.dto';
import { UpdateAdDto } from '../ads/dto/update-ad.dto';
import { Ad } from './schemas/ads.schema';
import { AdStatus } from '../../common/enum/adsstatus.enum';

@Injectable()
export class AdsService {
  constructor(@InjectModel(Ad.name) private adModel: Model<Ad>) {}

  async create(dto: CreateAdDto) {
    return this.adModel.create({
      ...dto,
      status: AdStatus.PENDING,
     
    });
  }

  /* Update ad by provider (only own ads) */
  async update(adId: string, dto: UpdateAdDto) {
    const ad = await this.adModel.findById(adId);
    if (!ad) throw new NotFoundException('common.errors.AD_NOT_FOUND');
     
    Object.assign(ad, dto);
    ad.status = AdStatus.PENDING;
    return ad.save();
  }

  findAllByProvider(providerId: string) {
    return this.adModel.find({ providerId, isDeleted: false });
  }


  findAllPublic() {
    return this.adModel
      .find({ status: AdStatus.APPROVED, isDeleted: false })
      .sort({ createdAt: -1 });
  }

  async createByAdmin(dto: CreateAdDto) {
    if (!dto.link_to)
      throw new BadRequestException('common.errors.LINK_TO_SALOON_ID_REQUIRED');

    return this.adModel.create({
      ...dto,
      status: AdStatus.APPROVED,
      providerId: dto.link_to,
    });
  }

  async approve(adId: string) {
    const ad = await this.adModel.findByIdAndUpdate(
      adId,
      { status: AdStatus.APPROVED },
      { new: true },
    );
    if (!ad) throw new NotFoundException('common.errors.AD_NOT_FOUND');
    return ad;
  }

  async reject(adId: string) {
    const ad = await this.adModel.findByIdAndUpdate(
      adId,
      { status: AdStatus.REJECTED },
      { new: true },
    );
    if (!ad) throw new NotFoundException('common.errors.AD_NOT_FOUND');
    return ad;
  }

  findAllForAdmin() {
    return this.adModel.find();
  }

  async softDeleteByAdmin(adId: string) {
    const ad = await this.adModel.findById(adId);

    if (!ad || ad.isDeleted) {
      throw new NotFoundException('common.errors.AD_NOT_FOUND');
    }

    ad.isDeleted = true;
    return ad.save();
  }
}

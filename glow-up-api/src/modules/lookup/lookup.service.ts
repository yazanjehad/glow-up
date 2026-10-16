import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateLookupDto } from './dto/create-lookup.dto';
import { UpdateLookupDto } from './dto/update-lookup.dto';
import { Lookup, LookupDocument } from './schemas/lookup.schema';
import { GetLookupsFilterDto } from './dto/get-lookups-filter.dto';

@Injectable()
export class LookupService {
  constructor(
    @InjectModel(Lookup.name)
    private readonly lookupModel: Model<LookupDocument>,
  ) {}

  async create(dto: CreateLookupDto) {
    try {
      const lookup = await this.lookupModel.create(dto);
      return lookup;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create lookup');
    }
  }

  async findAll(key?: string, activeOnly = true) {
    const filter: any = {};
    if (key) filter.key = key.toUpperCase();
    if (activeOnly) filter.isActive = true;

    return this.lookupModel
      .find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();
  }

  async findOne(id: string) {
    const lookup = await this.lookupModel.findById(id).lean();
    if (!lookup) throw new NotFoundException('common.errors.LOOKUP_NOT_FOUND');
    return lookup;
  }

  async validateLookup(key: string, id: string) {
    const lookup = await this.lookupModel.findOne({
      _id: id,
      key: key.toUpperCase(),
      isActive: true,
    });
    if (!lookup) {
      throw new BadRequestException('common.errors.INVALID_LOOKUP');
    }
    return lookup;
  }

  async getDataByKey(key: string, type: string) {
    const lookup = await this.lookupModel.findOne({
      key: key,
      code: type.toUpperCase(),
      isActive: true,
    });
    return lookup;
  }
  async update(id: string, dto: UpdateLookupDto) {
    const updated = await this.lookupModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!updated) throw new NotFoundException('common.errors.LOOKUP_NOT_FOUND');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.lookupModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('common.errors.LOOKUP_NOT_FOUND');
    return { success: true };
  }
  async getAllLookups(query: GetLookupsFilterDto) {
    const {
      key,
      page = '1',
      limit = '20'
    } = query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (key) filter.key = key;

    const [data, total] = await Promise.all([
      this.lookupModel
        .find(filter)
        .sort({ order: 1, createdAt: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      this.lookupModel.countDocuments(filter),
    ]);

    return {

      totalPages: Math.ceil(total / Number(limit)),
      data,
      page: Number(page),
      limit: Number(limit),
      total,
    };
  }
}

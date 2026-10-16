import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import {
  CustomerProfile,
  CustomerProfileDocument,
} from './schemas/customer-profile.schema';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  ServiceProvider,
  ServiceProviderDocument,
} from '../provider/schemas/service-provider.schema';
import { GenderType } from 'src/common/enum/gendertype.enum';

//  MOD: added DTO imports
import { GetCustomerMeResponseDto } from './dto/get-customer-profile.dto';
import {
  GetCustomerFavoritesResponseDto,
  FavoriteProviderResponseDto,
} from './dto/get-customer-favorites.dto';
import { GetCustomersFilterDto } from './dto/get-customers-filter.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(CustomerProfile.name) private profileModel: Model<CustomerProfile>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(ServiceProvider.name)
    private readonly providerModel: Model<ServiceProviderDocument>,
  ) {}

  /* ================= Get My Profile ================= */
  //  MOD: added return type for DTO
  async getMyProfile(userId: string): Promise<GetCustomerMeResponseDto> {
    const profile = await this.profileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId');

    if (!profile) {
      throw new BadRequestException('common.errors.NO_CUSTOMER_PROFILE_FOUND');
    }

    const user = profile.userId as any;
    const nameParts = user?.name?.trim().split(' ') ?? [];
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') ?? '';

    return {
      id: profile._id.toString(),
      firstName,
      lastName,
      gender: profile.gender,
      birthDate: profile.birthDate,
      email:user.email ?? null,
      phone:user.phone
    };
  }

  /* ================= Update My Profile ================= */
  async updateMyProfile(userId: string, dto: UpdateCustomerProfileDto) {
    const profile = await this.profileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          ...(dto.gender && { gender: dto.gender }),
          ...(dto.birthDate && { birthDate: dto.birthDate }),
          // ...(dto.avatar && { avatar: dto.avatar }),
          // ...(dto.city && { city: dto.city }),
          // ...(dto.address && { address: dto.address }),
        },
      },
      { new: true },
    );

    if (!profile) {
      throw new NotFoundException('common.errors.CUSTOMER_PROFILE_NOT_FOUND');
    }

    if (dto.firstName || dto.lastName || dto.gender || dto.birthDate) {
      const updateUserPayload: any = {};

      if (dto.firstName || dto.lastName) {
         const user = await this.userModel.findById(userId).lean();

  const currentName = user?.name || '';
  const [currentFirstName = '', ...rest] = currentName.split(' ');
  const currentLastName = rest.join(' ');

  const firstName = dto.firstName ?? currentFirstName;
  const lastName = dto.lastName ?? currentLastName;

  updateUserPayload.name = `${firstName} ${lastName}`.trim();
      }

      if (dto.gender) {
        updateUserPayload.gender = dto.gender;
      }

      if (dto.birthDate) {
        updateUserPayload.birthDate = dto.birthDate;
      }

      if (Object.keys(updateUserPayload).length > 0) {
        await this.userModel.findByIdAndUpdate(userId, {
          $set: updateUserPayload,
        });
      }
    }

    return this.getMyProfile(userId);
  }

  async createProfile(
    data: {
      userId: Types.ObjectId;
      firstname: string;
      lastname: string;
      gender?: GenderType;
      birthDate?: Date;
    },
    session?: ClientSession
  ) {
    const s = session ?? (await this.profileModel.db.startSession());
    let newTransaction = false;

    if (!session) {
      s.startTransaction();
      newTransaction = true;
    }

    try {
      // ======== Check if profile already exists ========
      const exists = await this.profileModel
        .exists({ userId: data.userId })
        .session(s);

      if (exists) {
        throw new BadRequestException('common.errors.CUSTOMER_PROFILE_ALREADY_EXISTS');
      }
      // // BIRTHDATE_INVALID
      // if (data.birthDate && data.birthDate > new Date()) {
      //   throw new BadRequestException('common.errors.BIRTHDATE_INVALID');
      // }

      //

      // ======== Create profile ========
      const profileArr = await this.profileModel.create(
        [
          {
            userId: data.userId,
            firstname: data.firstname,
            lastname: data.lastname,
            gender: data.gender,
            birthDate: data.birthDate,
          },
        ],
        s ? { session: s } : undefined
      );

      if (newTransaction) {
        await s.commitTransaction();
        s.endSession();
      }

      return profileArr[0];
    } catch (error) {
      if (newTransaction) {
        await s.abortTransaction();
        s.endSession();
      }
      throw error;
    }
  }


  /* ================= get Favorites ================= */
  async getFavorites(userId: string): Promise<GetCustomerFavoritesResponseDto> {
    const profile = await this.profileModel
      .findOne({
        userId: new Types.ObjectId(userId),
      })
      .populate({
        path: 'favorites',
        select: 'name description rating type  coverImage address status genderType',
        populate: {
          path: 'type',
          select: ' name',
        },
      });

    if (!profile) throw new NotFoundException('common.errors.USER_NOT_FOUND');

    const favs = (profile.favorites ?? []) as any[];

    const result: FavoriteProviderResponseDto[] = favs.map((p) => ({
      id: String(p._id), //  MOD: provide id field for DTO
      name: p.name,
      rating: p.rating,
      description: p.description,
      type: p.type,
      address: p.address,
      genderType: p.genderType,
      coverImage: p.coverImage,
      status: p.status,
    }));

    return result; //  MOD
  }

  //////////////////////// Add Favorite ////////////////////////
  async addFavorite(userId: string, providerId: string) {
    const profile = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) throw new NotFoundException('common.errors.PROFILE_NOT_FOUND');

    // التحقق من وجود مزود الخدمة
    const provider = await this.providerModel.findById(providerId);
    if (!provider) throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');

    if (!profile.favorites) profile.favorites = [];

    const providerObjectId = new Types.ObjectId(providerId);

    // التأكد من عدم التكرار بشكل صحيح
    if (!profile.favorites.some((id) => id.equals(providerObjectId))) {
      profile.favorites.push(providerObjectId);
      await profile.save();
    }

    return await profile.populate(
      'favorites',
      'name description rating type address coverImage status',
    );
  }

  ////////////////////////// Remove Favorite ////////////////////////
  async removeFavorite(userId: string, providerId: string) {
    const profile = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) throw new NotFoundException('common.errors.PROFILE_NOT_FOUND');

    const providerObjectId = new Types.ObjectId(providerId);
    profile.favorites = profile.favorites.filter(
      (id) => !id.equals(providerObjectId),
    );

    await profile.save();

    return await profile.populate(
      'favorites',
      'name description rating type city coverImage status',
    );
  }

  async findByUserId(userId: any): Promise<User | null> {
    return this.profileModel.findOne({
      userId: userId,
    });
  }
  /////////////////////////////
  async getAllCustomers(query: GetCustomersFilterDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [];

    const initialMatch: any = {};
    if (query.createdAfter || query.createdBefore) {
      initialMatch.createdAt = {};
      if (query.createdAfter) initialMatch.createdAt.$gte = new Date(query.createdAfter);
      if (query.createdBefore) initialMatch.createdAt.$lte = new Date(query.createdBefore);
    }
    if (Object.keys(initialMatch).length) pipeline.push({ $match: initialMatch });

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'appointments',
          localField: 'userId',
          foreignField: 'customerId',
          pipeline: [{ $count: 'count' }],
          as: 'appointmentCount',
        },
      },
      {
        $lookup: {
          from: 'ratings',
          localField: 'userId',
          foreignField: 'customerId',
          pipeline: [
            { $group: { _id: null, avg: { $avg: '$rating' } } }
          ],
          as: 'ratingCalc',
        },
      },
      {
        $addFields: {
          totalBookings: { $ifNull: [{ $arrayElemAt: ['$appointmentCount.count', 0] }, 0] },
          avgRating: { $ifNull: [{ $arrayElemAt: ['$ratingCalc.avg', 0] }, 0] },
        },
      }
    );

    const finalMatch: any = {};
    if (query.minBookings) finalMatch.totalBookings = { $gte: Number(query.minBookings) };
    if (query.maxBookings) finalMatch.totalBookings = {
      ...(finalMatch.totalBookings || {}),
      $lte: Number(query.maxBookings),
    };
    if (query.minRating) finalMatch.avgRating = { $gte: Number(query.minRating) };
    if (query.maxRating) finalMatch.avgRating = {
      ...(finalMatch.avgRating || {}),
      $lte: Number(query.maxRating),
    };
    if (Object.keys(finalMatch).length) pipeline.push({ $match: finalMatch });

    const sortOption: any = {};
    if (query.sortBy === 'bookings') sortOption.totalBookings = -1;
    else if (query.sortBy === 'rating') sortOption.avgRating = -1;
    else sortOption.createdAt = -1;

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: sortOption },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              firstname: 1,
              lastname: 1,
              gender: 1,
              birthDate: 1,
              status: 1,
              createdAt: 1,
              totalBookings: 1,
              avgRating: 1,
              user: 1,
            },
          },
        ],
      },
    });

    const [result] = await this.profileModel.aggregate(pipeline);
    const total = result.metadata[0]?.total || 0;
    const rawData = result.data;

    return {
      data: rawData.map(c => ({
        id: c._id.toString(),
        firstName: c.firstname,
        lastName: c.lastname,
        email: c.user?.email,
        phone: c.user?.phone,
        gender: c.gender,
        birthDate: c.birthDate instanceof Date ? c.birthDate.toISOString().split('T')[0] : c.birthDate,
        totalBookings: c.totalBookings,
        avgRating: parseFloat(c.avgRating.toFixed(2)),
        status: c.status,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString().split('T')[0] : c.createdAt,
      })),
      total,
      page,
      limit,
    }
  }

  async markCustomerAsDeleted(userId: string, session?: ClientSession) {
    await this.profileModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),

          firstname: 'Deleted',
          lastname: 'User',
          birthDate: null,
          gender: null,

          favorites: [],
        },
      },
      { session }
    );
  }
}

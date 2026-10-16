import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Rating, RatingDocument } from './schemas/rating.schema';
import {
  Appointment,
  AppointmentDocument,
} from '../appointment/schemas/appointment.schema';
import { AppointmentStatus } from '../appointment/enum/appointmentstatus.enum';
import { CreateRatingDto } from './dto/create-rating.dto';
import {
  ServiceProvider,
  ServiceProviderDocument,
} from '../provider/schemas/service-provider.schema';
import { GetRatingsPaginatedResponseDto, GetRatingsQueryDto, ProviderRatingsResponseDto, RatingResponseDto } from './dto/provider-rating-response.dto';
import { RatingType } from '../../common/enum/RatingType.enum';

@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Rating.name)
    private readonly ratingModel: Model<RatingDocument>,

    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,

    @InjectModel(ServiceProvider.name)
    private readonly providerModel: Model<ServiceProviderDocument>,
  ) {}

  /* ================= Create Rating ================= */
  async create(customerId: string, dto: CreateRatingDto) {
    const session = await this.ratingModel.db.startSession();
    session.startTransaction();

    try {
      const appointment = await this.appointmentModel.findById(dto.appointmentId).session(session);

      if (!appointment) {
        throw new NotFoundException('common.errors.APPOINTMENT_NOT_FOUND');
      }

      if (appointment.customerId?.toString() !== customerId){
        throw new ForbiddenException('common.errors.NOT_YOUR_APPOINTMENT');
      }

      if (appointment.status !== AppointmentStatus.COMPLETED) {
        throw new BadRequestException('common.errors.APPOINTMENT_NOT_COMPLETED_YET');
      }

      const type = dto.employeeId ? RatingType.EMPLOYEE : RatingType.PROVIDER;


      if (type === RatingType.EMPLOYEE && !dto.employeeId) {
        throw new BadRequestException('common.errors.EMPLOYEE_ID_REQUIRED_FOR_RATING');
      }

      const exists = await this.ratingModel.findOne({ 
        appointmentId: appointment._id,
         type:type,
        }).session(session);

      if (exists) {
        throw new BadRequestException('common.errors.APPOINTMENT_ALREADY_RATED_AS_TYPE');
      }

      const rating = await this.ratingModel.create([{
        appointmentId: appointment._id,
        providerId: appointment.providerId,
        employeeId: dto.employeeId ? new Types.ObjectId(dto.employeeId) : undefined,
        customerId: new Types.ObjectId(customerId),
        rating: dto.rating,
        comment: dto.comment,
        type: type,
      }], { session });

      if (type === RatingType.PROVIDER) {
        await this.updateProviderRating(appointment.providerId, session);
      }

      await session.commitTransaction();
      session.endSession();

      return rating[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /* ================= Get All Provider Ratings ================= */
  async getAllProviderRatings2(): Promise<RatingResponseDto[]> {
    const ratings = await this.ratingModel
      .find()
      .populate('providerId', 'name')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    return ratings.map((rating) => ({
      id: rating._id.toString(),
      rating: rating.rating,
      comment: rating.comment,
      isDeleted: rating.isDeleted,

      provider: {
        id: rating.providerId['_id'].toString(),
        name: (rating.providerId['name'] as string) || '',
      },

      customer: {
        id: rating.customerId['_id'].toString(),
        name: (rating.customerId['name'] as string) || '',
      },

      //createdAt: rating.createdAt.toISOString(),
      //createdAt: rating.createdAt ? rating.createdAt.toISOString() : 'N/A',
    }));
  }
async getAllProviderRatings(
  query: GetRatingsQueryDto,
): Promise<GetRatingsPaginatedResponseDto> {
  const {
    page = 1,
    limit = 10,
    providerId,
    customerId,
  } = query;

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;

  const filter: any = {
    isDeleted: false,
  };

  if (providerId) {
    if (!Types.ObjectId.isValid(providerId)) {
      throw new BadRequestException('Invalid providerId');
    }
    filter.providerId = new Types.ObjectId(providerId);
  }

  if (customerId) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customerId');
    }
    filter.customerId = new Types.ObjectId(customerId);
  }

  const [ratings, total] = await Promise.all([
    this.ratingModel
      .find(filter)
      .populate('providerId', 'name')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    this.ratingModel.countDocuments(filter),
  ]);

  const items = ratings.map((rating: any) => ({
    id: rating._id.toString(),
    rating: rating.rating,
    comment: rating.comment,
    isDeleted: rating.isDeleted,
    createdAt:rating.createdAt,
    provider: {
      id: rating.providerId?._id?.toString() || '',
      name: rating.providerId?.name || '',
    },
    customer: {
      id: rating.customerId?._id?.toString() || '',
      name: rating.customerId?.name || '',
    },
  }));

  const totalPages = Math.ceil(total / safeLimit);

  return {
    items,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
}
    /* ================= Update Provider Rating ================= */
  private async updateProviderRating(providerId: Types.ObjectId, session?: any) {
    const ratings = await this.ratingModel.find({
      providerId,
      type: RatingType.PROVIDER,
      isDeleted: false,
    }).session(session);

    const count = ratings.length;
    const average = ratings.reduce((sum, r) => sum + r.rating, 0) / (count || 1);

    await this.providerModel.findByIdAndUpdate(providerId, { 
        rating: {
          average: Number(average.toFixed(1)),
          count,
        } ,
      },{ session },);
  }
  /////////////////////delete rating for admin & super admin   /////////////////////
  async DeleteRating(ratingId: string) {
    const session = await this.ratingModel.db.startSession();
    session.startTransaction();

    try {
      const rating = await this.ratingModel.findByIdAndUpdate(
        ratingId,
        { isDeleted: true },
        { new: true, session },
      );

    if (!rating) {
      throw new NotFoundException('common.errors.RATING_NOT_FOUND');
    }
      await this.updateProviderRating(rating.providerId, session);
      await session.commitTransaction();
      session.endSession();

      return { message: 'Rating deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /////////////////////// Get Ratings By Provider with Pagination ///////////////////
  async getRatingsByProvider(providerId: Types.ObjectId, page = 1, limit = 10):Promise<ProviderRatingsResponseDto> {
    const skip = (page - 1) * limit;
    const aggregation = await this.ratingModel.aggregate([
      { $match: { providerId, type: RatingType.PROVIDER, isDeleted: false } },
      {
        $lookup: {
          from: 'users',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          reviews: [{ $skip: skip }, { $limit: limit }],
          summary: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                five: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                four: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                three: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                two: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                one: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
              },
            },
          ],
        },
      },
    ]);
    const reviews = aggregation[0].reviews.map((r) => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      customer: {
        id: r.customer._id.toString(),
        name: r.customer.name,
        // avatar: r.customer.avatar || null,
      },
    }));
    const summaryData = aggregation[0].summary[0] || {
      totalReviews: 0,
      averageRating: 0,
      five: 0,
      four: 0,
      three: 0,
      two: 0,
      one: 0,
    };
    const totalPages = Math.ceil(summaryData.totalReviews / limit);
    return {
      summary: {
        averageRating: Number(summaryData.averageRating?.toFixed(1) || 0),
        totalReviews: summaryData.totalReviews,
        distribution: {
          '5': summaryData.five,
          '4': summaryData.four,
          '3': summaryData.three,
          '2': summaryData.two,
          '1': summaryData.one,
        },
      },
      reviews,
      current_page: page,
      total_pages: totalPages,
    };
  }
  /* ================= Get Provider Ratings ================= */
  async getProviderRatings(providerId: string): Promise<RatingResponseDto[]> {
    if (!Types.ObjectId.isValid(providerId)) {
      throw new BadRequestException('common.errors.PROVIDER_ID_INVALID');
    }

    const pid = new Types.ObjectId(providerId);

    const ratings = await this.ratingModel
      .find({ providerId: pid , type: RatingType.PROVIDER}) // filter by provider
      .populate('providerId', 'name')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    return ratings.map((rating) => ({
      id: rating._id.toString(),
      rating: rating.rating,
      comment: rating.comment,

      provider: {
        id: rating.providerId['_id'].toString(),
        name: (rating.providerId['name'] as string) || '',
      },

      customer: {
        id: rating.customerId['_id'].toString(),
        name: (rating.customerId['name'] as string) || '',
      },
    }));
  } async getEmployeeRatingsDetailed(employeeId: Types.ObjectId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const aggregation = await this.ratingModel.aggregate([
      
      { $match: { employeeId, type: RatingType.EMPLOYEE, isDeleted: false } },

       
      {
        $lookup: {
          from: 'users',
          let: { customerId: '$customerId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$customerId'] } } },
            { $project: { name: 1, avatar: 1 } } // جلب الاسم والصورة بس
          ],
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      { $sort: { createdAt: -1 } },

      // 3. التقسيم (Facet) لجلب القائمة والملخص معاً
      {
        $facet: {
          reviews: [{ $skip: skip }, { $limit: limit }],
          stats: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                five: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                four: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                three: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                two: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                one: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
              },
            },
          ],
        },
      },
    ]);

    const stats = aggregation[0].stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      five: 0, four: 0, three: 0, two: 0, one: 0
    };

    const total = stats.totalReviews || 1;  

    return {
      summary: {
        averageRating: Number(stats.averageRating?.toFixed(1) || 0),
        totalReviews: stats.totalReviews,
        
        distribution: [
          { stars: 5, count: stats.five, percentage: Math.round((stats.five / total) * 100) },
          { stars: 4, count: stats.four, percentage: Math.round((stats.four / total) * 100) },
          { stars: 3, count: stats.three, percentage: Math.round((stats.three / total) * 100) },
          { stars: 2, count: stats.two, percentage: Math.round((stats.two / total) * 100) },
          { stars: 1, count: stats.one, percentage: Math.round((stats.one / total) * 100) },
        ],
      },
      reviews: aggregation[0].reviews.map((r) => ({
        id: r._id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString().split('T')[0].replace(/-/g, '/'),
        customer: {
          id: r.customer._id,
          name: r.customer.name,

        },
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(stats.totalReviews / limit),
        total_reviews: stats.totalReviews
      }
    };
  }

// async getAveragRating(employeeId){

//    const employeeRatings = await this.ratingModel.aggregate([
//       { $match: { employeeId: { $in: employees.map(e => e._id) } } },
//       {
//         $group: {
//           _id: '$employeeId',
//           average: { $avg: '$rating' },
//           count: { $sum: 1 },
//         },
//       },
//     ]);
// }

}

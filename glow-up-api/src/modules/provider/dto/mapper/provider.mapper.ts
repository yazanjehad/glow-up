import { ProviderResponseDto } from "../provider-response.dto";


export function mapProviderToResponse(
  provider: any,
  favoriteIds: string[] = [],
): ProviderResponseDto {
  const owner = provider.userId as any;

  // ===== Build service items map (for packages) =====
  const serviceItemMap = new Map<string, any>();

  for (const category of provider.services ?? []) {
    for (const item of category.items ?? []) {
      serviceItemMap.set(item._id.toString(), item);
    }
  }

const packagesMapped = (provider.packages ?? []).map((pkg: any) => ({
  _id: pkg._id?.toString() || pkg._id,
  name: pkg.name,
  desc: pkg.desc,
  price: pkg.price,
  isActive: pkg.isActive,
  items: (pkg.items ?? [])
    .map((i: any) => {
      let serviceItemId =
        i.serviceItemId?._id || i.serviceItemId || i.serviceItemId?.$oid;
      if (!serviceItemId) return null;

      serviceItemId = serviceItemId.toString();

      const serviceItem = serviceItemMap.get(serviceItemId);
      if (!serviceItem) return null;

      return {
        _id: serviceItem._id?.toString() || serviceItem._id,
        name: serviceItem.name,
        type: serviceItem.type,
        description: serviceItem.description,
        image: serviceItem.image,
        price: serviceItem.price,
        durationMinutes: serviceItem.durationMinutes,
        isActive: serviceItem.isActive,
        quantity: i.quantity,
      };
    })
    .filter(Boolean),
}));



  return {
    _id: provider._id.toString(),
    userId: owner?._id?.toString(),

    name: provider.name,
    description: provider.description,

    phone: owner?.phone,
    email: owner?.email,

    type: provider.type,
    genderType: provider.genderType,
    status: provider.status,

    phones: provider.phones ?? [],

    address: provider.address,
    latitude: provider.location?.coordinates?.[1],
    longitude: provider.location?.coordinates?.[0],
    serviceLocation: provider.serviceLocation,

    logo: provider.logo,
    coverImage: provider.coverImage,
    gallery: provider.gallery ?? [],
    rejectionReason: provider.rejectionReason,
    services: (provider.services ?? []).map((category: any) => ({
      _id: category._id.toString(),
      category: category.category,
      items: (category.items ?? []).map((item: any) => ({
        _id: item._id.toString(),
        type: item.type,
        name: item.name,
        description: item.description,
        image: item.image,
        price: item.price,
        durationMinutes: item.durationMinutes,
        isActive: item.isActive,
      })),
    })),

    // ===== Packages =====
    packages: packagesMapped,

workingHours: provider.workingHours
  ? {
      timezone: provider.workingHours.timezone,

      weekly: (provider.workingHours.weekly ?? []).map((day: any) => ({
        day: day.day,
        isOpen: day.isOpen,
        openTime: day.openTime,
        closeTime: day.closeTime,
      })),

      exceptions: provider.workingHours.exceptions ?? [],

      breaks: {
        weekly: (provider.workingHours.breaks?.weekly ?? []).map((b: any) => ({
          id: b._id?.toString(),
          day: b.day,
          startTime: b.startTime,
          endTime: b.endTime,
          reason: b.reason,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })),

        custom: (provider.workingHours.breaks?.custom ?? []).map((b: any) => ({
          id: b._id?.toString(),
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          reason: b.reason,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })),
      },
    }
  : undefined,

    rating: mapRatingToResponse(provider.rating),


    employees: provider.employees ?? [],
     appointmentStrategy:provider.appointmentStrategy,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
    isFavorite: favoriteIds.includes(provider._id.toString()),
  };
}


function mapRatingToResponse(rating: any) {
  if (!rating) {
    return {
      summary: {
        averageRating: 0,
        totalReviews: 0,
        distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
      },
      reviews: [],
      current_page: 1,
      total_pages: 0,
    };
  }

  return {
    summary: {
      averageRating: Number(rating.summary?.averageRating?.toFixed(1)) || 0,
      totalReviews: rating.summary?.totalReviews || 0,
      distribution: {
        '5': rating.summary?.distribution?.['5'] || 0,
        '4': rating.summary?.distribution?.['4'] || 0,
        '3': rating.summary?.distribution?.['3'] || 0,
        '2': rating.summary?.distribution?.['2'] || 0,
        '1': rating.summary?.distribution?.['1'] || 0,
      },
    },
    reviews: (rating.reviews ?? []).map((r: any) => ({
      id: r.id?.toString() || r._id?.toString(),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      customer: r.customer
        ? {
            id: r.customer.id?.toString() || r.customer._id?.toString(),
            name: r.customer.name,
          }
        : null,
    })),
    current_page: rating.current_page ?? 1,
    total_pages: rating.total_pages ?? 0,
  };
}

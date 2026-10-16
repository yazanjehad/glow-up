import type { LocalizedName } from "../provider/lookups.types";

export type LookupRefDto = { _id?: string; name?: LocalizedName; code?: string };

export type FavoriteSalonDto = {
    id?: string;
    _id?: string;
    name?: string | LocalizedName;
    rating?: {
        average?: number;
        count?: number;
    };
    description?: string;
    type?: string | LookupRefDto;
    city?: string;
    coverImage?: string;
    status?: string;
};
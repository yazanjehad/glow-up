import process from "process";
import { get, post, del } from "../../http/http.client";
import { SalonUi } from "../provider/provider.types";
import { FavoriteSalonDto } from "./customer.types";


export type GetFavoritesResponse =
  | FavoriteSalonDto[]
  | { favorites?: FavoriteSalonDto[]; data?: FavoriteSalonDto[] };

function extractFavoritesList(raw: GetFavoritesResponse): FavoriteSalonDto[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.favorites)) return raw.favorites;
    if (Array.isArray(raw.data)) return raw.data;
  }
  return [];
}

function safeStr(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>;
    const n = o.name ?? o.ar ?? o.en ?? o.code;
    return typeof n === "string" ? n : safeStr(n);
  }
  return "";
}

export const CustomerService = {
    async setFavorite(id: string): Promise<void> {
        await post<void>(`/customer/favorites`, { providerId: id });
    },
    async removeFavorite(id: string): Promise<void> {
        await del<void>(`/customer/favorites/${id}`);
    },
    async isFavorite(id: string): Promise<boolean> {
        const res = await this.getFavorites();
        let isFavorite = false;
        if (res) {
            res.forEach(element => {
                if (element.id == id) {
                    isFavorite = true;
                    return;
                }
            });
        }
        return isFavorite;
    },
    async getFavorites(): Promise<SalonUi[]> {
        const apiResponse = await get<GetFavoritesResponse>("/customer/favorites");
        const raw: GetFavoritesResponse = apiResponse.data;
        const data = extractFavoritesList(raw);
        return data.map((dto) => mapApiToSalon(dto));
    },
}
export const mapApiToSalon = (dto: FavoriteSalonDto): SalonUi => ({
    
    id: dto.id ?? dto._id ?? "0",
    name: safeStr(dto.name) || "Unknown Salon",
    description: typeof dto.description === "string" ? dto.description : "Unknown description",
    category: safeStr(dto.type) || "Salon",
    coverImage: (() => {
      const base =
        process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "https://api-staging.theglowhub.com.sa";
      const path = dto.coverImage?.trim();
      if (!base || !path || /^string$/i.test(path))
        return "https://t4.ftcdn.net/jpg/06/53/00/35/240_F_653003534_TvjtsbAWKpEkwcqVpkOnFqOmIyCkqSyT.jpg";
      const p = path.startsWith("/") ? path.slice(1) : path;
      return `${base.replace(/\/$/, "")}/files/public?path=${encodeURIComponent(p)}`;
    })(),
    rating: dto.rating?.average ?? 0,
    reviews: dto.rating?.count ?? 0,
    location: (typeof dto.city === "string" && dto.city.trim()) ? dto.city.trim() : (dto as any).address || "—",
    appointmentStrategy: "DIRECT",
});
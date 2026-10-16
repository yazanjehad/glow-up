import { get } from "../../http/http.client";
import type { SiteStatsApiResponse } from "./report.types";
import type { HeroData } from "@/app/models/HeroData";

function mapSiteStatsToHeroData(data: SiteStatsApiResponse): HeroData {
  return {
    numberOfNewClients: data.newUsersLastMonth,
    numberOfSalons: data.totalServiceProviders,
    numberOfBookings: data.totalAppointments,
  };
}

export const ReportService = {
  async getSiteStats(): Promise<HeroData> {
    const response = await get<SiteStatsApiResponse>("/report/stats/site");
    const raw = response.data;
    if (!raw) {
      return {
        numberOfNewClients: 0,
        numberOfSalons: 0,
        numberOfBookings: 0,
      };
    }
    return mapSiteStatsToHeroData(raw);
  },
};

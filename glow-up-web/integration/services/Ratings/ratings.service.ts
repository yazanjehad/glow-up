import axios from "axios";
import { get, post } from "../../http/http.client";
import type { RatingApiResponse, ReviewUI } from "@/app/models/Review-types";
import { mapApiToPublicReviews, emptyReviewsApiResponse } from "@/app/models/Review-types";

export interface CreateRatingPayload {
  appointmentId: string;
  rating: number;
  comment?: string;
  employeeId?: string;
}


export const RatingsService = {
  async getPublicReviews(providerId: string, page: number = 1, limit: number = 10): Promise<ReviewUI> {
    try {
      const apiResponse = await get<RatingApiResponse>(
        `/ratings/public/provider/${providerId}`,
        { params: { page, limit } },
      );
      return mapApiToPublicReviews(apiResponse.data);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        return emptyReviewsApiResponse();
      }
      throw e;
    }
  },

  async createRating(payload: CreateRatingPayload) {
    if (payload.rating < 1 || payload.rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    try {
      const response = await post(`/ratings`, payload);
      return response.data;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 401) {
          throw new Error("Unauthorized. Please login first.");
        }
        console.error("Backend Validation Error:", e.response?.data);
      }
      throw e;
    }
  }
};
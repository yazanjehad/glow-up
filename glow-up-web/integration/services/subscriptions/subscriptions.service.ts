import { get, post, patch } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";
import {
  Plan,
  PlansResponse,
  CreatePlanPayload,
  UpdatePlanPayload,
  SubscribeProviderPayload,
  Subscription,
  SubscriptionResponse,
} from "./subscriptions.types";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const subscriptionsService = {
  // Get all plans with optional type filter
  getPlans: async (type?: string): Promise<Plan[]> => {
    const url = type ? `/subscriptions/plans?type=${type}` : "/subscriptions/plans";
    const res = await get<PlansResponse | Plan[]>(url, {
      headers: authHeader(),
    });
    // Handle both array response and object with data property
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return (res.data as PlansResponse)?.data ?? [];
  },

  // Create a new plan (Admin only)
  createPlan: async (payload: CreatePlanPayload): Promise<Plan> => {
    const res = await post<{ data: Plan } | Plan>("/subscriptions/plan", payload, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return (res.data as any)?.data ?? res.data;
  },

  // Update a plan (Admin only)
  updatePlan: async (planId: string, payload: UpdatePlanPayload): Promise<Plan> => {
    const res = await patch<{ data: Plan } | Plan>(
      `/subscriptions/plan/${planId}`,
      payload,
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return (res.data as any)?.data ?? res.data;
  },

  // Deactivate a plan (Admin only)
  deletePlan: async (planId: string): Promise<string | undefined> => {
    // Backend moved from DELETE to PATCH deactivate endpoint.
    // Note: some environments may expose the deactivate behavior on the plan id endpoint itself.
    try {
      const res = await patch(
        `/subscriptions/plan/${planId}/deactivate`,
        undefined,
        { headers: authHeader() }
      );
      const message =
        (res as any)?.data?.message ??
        (res as any)?.data?.data?.message ??
        (res as any)?.data?.data ??
        (res as any)?.message;
      return typeof message === "string" ? message : undefined;
    } catch {
      const res = await patch(`/subscriptions/plan/${planId}`, undefined, {
        headers: authHeader(),
      });
      const message =
        (res as any)?.data?.message ??
        (res as any)?.data?.data?.message ??
        (res as any)?.data?.data ??
        (res as any)?.message;
      return typeof message === "string" ? message : undefined;
    }
  },

  // Subscribe a provider to a plan
  subscribeProvider: async (payload: SubscribeProviderPayload): Promise<Subscription> => {
    const res = await post<{ data: Subscription } | Subscription>(
      "/subscriptions/subscribe-for-provider",
      payload,
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return (res.data as any)?.data ?? res.data;
  },

  // Get subscription for a specific provider
  getProviderSubscription: async (providerId: string): Promise<Subscription | null> => {
    try {
      const res = await get<SubscriptionResponse | Subscription>(
        `/subscriptions/provider/${providerId}`,
        {
          headers: authHeader(),
        }
      );
      return (res.data as any)?.data ?? res.data;
    } catch {
      return null;
    }
  },

  // Get my subscription (for logged-in provider)
  getMySubscription: async (): Promise<Subscription | null> => {
    try {
      const res = await get<SubscriptionResponse | Subscription>(
        "/subscriptions/my-subscription",
        {
          headers: authHeader(),
        }
      );
      return (res.data as any)?.data ?? res.data;
    } catch {
      return null;
    }
  },
};

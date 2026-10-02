import {
  CategoryCount,
  CulturalCheckResponse,
  Garment,
  GarmentListResponse,
  Outfit,
  SuggestRequest,
  SuggestResponse,
  RentalCatalogItem,
  RentalCalculateResponse,
  RentalBookingResponse
} from "./types";

const API_BASE = "/api/v1";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  async getGarments(params?: {
    category?: string;
    era?: string;
    is_traditional?: boolean;
    gender?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<GarmentListResponse> {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.era) query.set("era", params.era);
    if (params?.is_traditional !== undefined)
      query.set("is_traditional", String(params.is_traditional));
    if (params?.gender) query.set("gender", params.gender);
    if (params?.search) query.set("search", params.search);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.offset !== undefined) query.set("offset", String(params.offset));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<GarmentListResponse>(`/garments${qs}`);
  },

  async getGarmentById(id: string): Promise<Garment> {
    return request<Garment>(`/garments/${id}`);
  },

  async getCategories(): Promise<CategoryCount[]> {
    return request<CategoryCount[]>("/garments/categories");
  },

  async suggestOutfits(req: SuggestRequest): Promise<SuggestResponse> {
    return request<SuggestResponse>("/outfits/suggest", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  async createOutfit(data: {
    name: string;
    garment_ids: string[];
    occasion?: string;
    style_tag?: string;
    gender?: string;
  }): Promise<Outfit> {
    return request<Outfit>("/outfits", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async checkCultural(garment_ids: string[]): Promise<CulturalCheckResponse> {
    return request<CulturalCheckResponse>("/cultural/check", {
      method: "POST",
      body: JSON.stringify({ garment_ids }),
    });
  },

  async getLore(garment_type: string) {
    return request(`/cultural/lore/${garment_type}`);
  },

  async getRentalCatalog(): Promise<{ items: RentalCatalogItem[]; total: number }> {
    return request<{ items: RentalCatalogItem[]; total: number }>("/rentals/catalog");
  },

  async calculateRental(garment_ids: string[], rental_days: number, quantities: Record<string, number> = {}): Promise<RentalCalculateResponse> {
    return request<RentalCalculateResponse>("/rentals/calculate", {
      method: "POST",
      body: JSON.stringify({ garment_ids, rental_days, quantities }),
    });
  },

  async createBooking(data: {
    customer_name: string;
    phone: string;
    email?: string;
    rental_date: string;
    return_date: string;
    garment_ids: { garment_id: string; size: string; quantity: number }[];
    notes?: string;
  }): Promise<RentalBookingResponse> {
    return request<RentalBookingResponse>("/rentals/book", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export interface Garment {
  id: string;
  category: string;
  type: string;
  subtype?: string;
  display_name: string;
  display_name_en?: string;
  image_path: string;
  thumbnail_path?: string;
  image_url?: string;
  thumbnail_url?: string;
  primary_color?: string;
  colors: string[];
  pattern?: string;
  material?: string;
  era?: string;
  region?: string;
  gender_fit?: string;
  cultural_tier?: string;
  formality?: string;
  cultural_description?: string;
  cultural_notes?: Record<string, string>;
  is_traditional: boolean;
  remix_tags: string[];
  compatible_occasions: string[];
  is_preset: boolean;
  created_at?: string;
}

export interface GarmentListResponse {
  items: Garment[];
  total: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface OutfitItem {
  garment_id: string;
  layer_order: number;
  garment?: Garment;
}

export interface Outfit {
  id: string;
  name: string;
  headline?: string;
  occasion?: string;
  style_tag?: string;
  gender?: string;
  color_harmony_score?: number;
  cultural_integrity_score?: number;
  cultural_warning?: string;
  source: string;
  items: OutfitItem[];
  created_at?: string;
}

export interface SuggestRequest {
  occasion: string;
  style: string;
  gender?: string;
  pinned_garment_ids?: string[];
}

export interface SuggestResponse {
  outfits: SuggestedOutfit[];
}

export interface SuggestedOutfit {
  id: string;
  name: string;
  items: Garment[];
  cultural_integrity_score: number;
  cultural_warning?: string;
}

export interface CulturalViolation {
  severity: "error" | "warning" | "info";
  message: string;
  rule_id?: string;
}

export interface CulturalCheckResponse {
  is_valid: boolean;
  score: number;
  violations: CulturalViolation[];
}

// ============ Rental Types ============
export interface RentalCatalogItem extends Garment {
  rental_price_per_day?: number;
  deposit_per_item?: number;
  available_sizes?: string[];
  stock_quantity?: number;
}

export interface CartItem {
  garment: Garment;
  size: string;
  quantity: number;
}

export interface RentalCalculateResponse {
  items: { garment_id: string; display_name: string; daily_price: number; days: number; subtotal: number }[];
  subtotal: number;
  combo_discount_percent: number;
  discount_amount: number;
  deposit: number;
  total: number;
}

export interface RentalBookingResponse {
  id: string;
  customer_name: string;
  phone: string;
  rental_date: string;
  return_date: string;
  total_price: number;
  deposit_amount: number;
  status: string;
  created_at?: string;
}

from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field, field_validator

# ============================================================
# Helper: coerce None → [] for list fields from nullable DB columns
# ============================================================
def _none_to_list(v):
    return v if v is not None else []

# ============================================================
# Garment Schemas
# ============================================================

class GarmentTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    type_id: str
    name_vi: str
    name_en: str | None = None
    category: str
    subtype: str | None = None
    era: str | None = None
    region: str | None = None
    gender_fit: str | None = None
    cultural_tier: str | None = None
    formality: str | None = None
    cultural_description: str | None = None
    historical_lore: str | None = None
    cultural_notes: dict | None = None
    rules: list = Field(default_factory=list)
    is_traditional: bool = True
    remix_tags: list[str] = Field(default_factory=list)
    compatible_occasions: list[str] = Field(default_factory=list)

    @field_validator("rules", "remix_tags", "compatible_occasions", mode="before")
    @classmethod
    def coerce_none_to_list(cls, value):
        return _none_to_list(value)

class GarmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    parent_type_id: str
    category: str
    type: str
    subtype: str | None = None
    display_name: str
    display_name_en: str | None = None

    image_path: str
    thumbnail_path: str | None = None
    image_url: str | None = None
    thumbnail_url: str | None = None

    primary_color: str | None = None
    colors: list[str] = Field(default_factory=list)
    pattern: str | None = None
    material: str | None = None

    era: str | None = None
    region: str | None = None
    gender_fit: str | None = None
    cultural_tier: str | None = None
    formality: str | None = None

    cultural_description: str | None = None
    cultural_notes: dict | None = None

    is_traditional: bool = True
    remix_tags: list[str] = Field(default_factory=list)
    compatible_occasions: list[str] = Field(default_factory=list)

    is_preset: bool = True
    created_at: datetime | None = None

    @field_validator("colors", "remix_tags", "compatible_occasions", mode="before")
    @classmethod
    def coerce_none_to_list(cls, v):
        return _none_to_list(v)


class GarmentListResponse(BaseModel):
    items: list[GarmentResponse]
    total: int


class CategoryCount(BaseModel):
    category: str
    count: int


# ============================================================
# Outfit Schemas
# ============================================================

class OutfitItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    garment_id: str
    layer_order: int
    garment: GarmentResponse | None = None


class OutfitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    headline: str | None = None
    occasion: str | None = None
    style_tag: str | None = None
    gender: str | None = None

    color_harmony_score: float | None = None
    cultural_integrity_score: float | None = None
    cultural_warning: str | None = None
    ai_highlights: list[str] = Field(default_factory=list)
    ai_styling_tip: str | None = None
    ai_cultural_note: str | None = None

    source: str = "user_created"
    items: list[OutfitItemResponse] = Field(default_factory=list)
    created_at: datetime | None = None

    @field_validator("ai_highlights", mode="before")
    @classmethod
    def coerce_highlights(cls, v):
        return _none_to_list(v)


class SuggestRequest(BaseModel):
    occasion: str = Field(..., description="VD: tet, ky_yeu, dao_pho, le_hoi")
    style: str = Field(..., description="VD: streetwear, minimalist, y2k, thanh_lich")
    gender: str = Field(default="unisex", description="nam, nu, unisex")
    pinned_garment_ids: list[str] = Field(
        default_factory=list,
        description="Garment IDs phải có trong outfit",
    )


class SuggestedOutfit(BaseModel):
    id: str
    name: str
    items: list[GarmentResponse]
    cultural_integrity_score: float
    cultural_warning: str | None = None


class SuggestResponse(BaseModel):
    outfits: list[SuggestedOutfit]


class CreateOutfitRequest(BaseModel):
    name: str
    occasion: str | None = None
    style_tag: str | None = None
    gender: str | None = None
    garment_ids: list[str] = Field(..., min_length=2)


# ============================================================
# Cultural Check Schemas
# ============================================================

class CulturalCheckRequest(BaseModel):
    garment_ids: list[str] = Field(..., min_length=1)


class CulturalViolation(BaseModel):
    severity: str  # "error", "warning", "info"
    message: str
    rule_id: str | None = None


class CulturalCheckResponse(BaseModel):
    is_valid: bool
    score: float = Field(default=1.0, description="0-1 cultural integrity score")
    violations: list[CulturalViolation] = Field(default_factory=list)


class CulturalLoreResponse(BaseModel):
    garment_type: str
    display_name: str
    era: str | None = None
    region: str | None = None
    cultural_description: str | None = None
    cultural_notes: dict | None = None


# ============================================================
# Chat Schemas
# ============================================================

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatContext(BaseModel):
    occasion: str | None = None
    location: str | None = None
    style: str | None = None
    canvas_garment_ids: list[str] = Field(default_factory=list)

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: ChatContext | None = None

class ChatResponse(BaseModel):
    items: list[GarmentResponse] = Field(default_factory=list)


# ============================================================
# Rental Schemas
# ============================================================

class RentalCatalogItem(GarmentResponse):
    rental_price_per_day: float | None = None
    deposit_per_item: float | None = None
    available_sizes: dict | list | None = None
    stock_quantity: int = 1

class RentalCalculateRequest(BaseModel):
    garment_ids: list[str]
    rental_days: int
    quantities: dict[str, int] = Field(default_factory=dict)

class RentalCalculateResponse(BaseModel):
    items: list[dict]
    subtotal: float
    combo_discount_percent: float
    discount_amount: float
    deposit: float
    total: float

class BookingGarmentItem(BaseModel):
    garment_id: str
    size: str
    quantity: int = 1

class RentalBookingRequest(BaseModel):
    customer_name: str
    phone: str
    email: str | None = None
    rental_date: date
    return_date: date
    garment_ids: list[BookingGarmentItem]
    notes: str | None = None

class RentalBookingItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    garment_id: str
    size: str
    quantity: int
    garment: GarmentResponse | None = None

class RentalBookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    customer_name: str
    phone: str
    email: str | None = None
    rental_date: date
    return_date: date
    total_price: float
    deposit_amount: float
    status: str
    notes: str | None = None
    created_at: datetime
    items: list[RentalBookingItemResponse]

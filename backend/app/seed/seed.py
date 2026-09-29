import json
import logging
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from sqlalchemy import inspect, select, text
from app.config import get_settings
from app.database import async_session_maker
from app.models.cultural_rule import CulturalRule
from app.models.garment import Garment, GarmentType

logger = logging.getLogger("vietphuc-seed")
settings = get_settings()

SEED_DIR = Path(__file__).parent
DATA_DIR = Path(settings.storage_path)

# Try system fonts with fallback
try:
    FONT_TITLE = ImageFont.truetype("C:/Windows/Fonts/timesbd.ttf", 26)
    FONT_SUB = ImageFont.truetype("C:/Windows/Fonts/times.ttf", 15)
    FONT_TAG = ImageFont.truetype("C:/Windows/Fonts/times.ttf", 13)
    FONT_SEAL = ImageFont.truetype("C:/Windows/Fonts/timesbd.ttf", 18)
except Exception:
    FONT_TITLE = ImageFont.load_default()
    FONT_SUB = ImageFont.load_default()
    FONT_TAG = ImageFont.load_default()
    FONT_SEAL = ImageFont.load_default()

COLOR_MAP = {
    "Đỏ điều": (158, 42, 43),
    "Xanh cổ vịt": (38, 78, 90),
    "Vàng hoàng yến": (184, 134, 11),
    "Đen tuyền": (40, 38, 36),
    "Trắng ngà": (218, 206, 185),
    "Nâu sồng": (120, 75, 40),
    "Trắng ngọc": (205, 210, 215),
    "Đen huyền": (35, 33, 32),
    "Xanh denim": (74, 98, 120),
    "Vàng rơm": (195, 168, 118),
    "Trắng tinh": (220, 222, 225),
    "Gỗ tự nhiên": (148, 92, 56),
    "Màu chàm / Be": (160, 138, 112),
    "Nâu trầm": (88, 62, 40),
    "Đen bóng": (30, 30, 30),
    "Xanh chàm": (42, 72, 105),
    "Tím lục bình": (118, 78, 130),
    "Đỏ son": (175, 42, 42),
    "Đỏ thắm": (168, 28, 38),
    "Vàng mơ": (218, 182, 110),
    "Vàng kim": (202, 158, 42),
    "Xanh ngọc": (48, 138, 128),
}

def draw_garment_silhouette(draw: ImageDraw.ImageDraw, g_type: str, cx: int, cy: int, color: tuple):
    """Draw a minimalist, elegant stylized Eastern silhouette for each garment."""
    r, g, b = color
    fill_color = (r, g, b)
    stroke_color = (max(0, r - 30), max(0, g - 30), max(0, b - 30))

    if "ao_tac" in g_type:
        # Wide ceremonial flowing sleeves (Áo Tấc tay thụng)
        # Flowing robe body
        draw.polygon([(cx - 28, cy - 90), (cx + 28, cy - 90), (cx + 65, cy + 95), (cx - 65, cy + 95)], fill=fill_color, outline=stroke_color, width=2)
        # Wide sweeping sleeves
        draw.polygon([(cx - 25, cy - 85), (cx - 130, cy - 10), (cx - 110, cy + 50), (cx - 35, cy - 20)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx + 25, cy - 85), (cx + 130, cy - 10), (cx + 110, cy + 50), (cx + 35, cy - 20)], fill=fill_color, outline=stroke_color, width=2)
        # Standing collar (cổ đứng)
        draw.rectangle([cx - 16, cy - 108, cx + 16, cy - 88], fill=(245, 240, 230), outline=stroke_color, width=2)
        # Center vertical seam & buttons
        draw.line([(cx, cy - 88), (cx, cy + 95)], fill=(245, 240, 230), width=2)
        for by in range(cy - 75, cy - 10, 18):
            draw.ellipse([cx - 4, by - 4, cx + 4, by + 4], fill=(218, 165, 32))

    elif "nhat_binh" in g_type:
        # Imperial Nhat Binh robe with square collar and polychrome ribbon
        draw.polygon([(cx - 30, cy - 90), (cx + 30, cy - 90), (cx + 75, cy + 95), (cx - 75, cy + 95)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx - 28, cy - 85), (cx - 115, cy - 15), (cx - 95, cy + 45), (cx - 35, cy - 20)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx + 28, cy - 85), (cx + 115, cy - 15), (cx + 95, cy + 45), (cx + 35, cy - 20)], fill=fill_color, outline=stroke_color, width=2)
        # Rectangular collar (Cổ Nhật Bình)
        draw.rectangle([cx - 24, cy - 90, cx + 24, cy - 30], outline=(178, 34, 34), width=4, fill=(245, 240, 225))
        # Five-element ribbons (Ngũ hành)
        ribbon_colors = [(180, 40, 40), (218, 165, 32), (38, 78, 90), (245, 245, 245), (35, 35, 35)]
        for idx, rc in enumerate(ribbon_colors):
            draw.line([(cx - 20 + idx * 10, cy - 30), (cx - 20 + idx * 10, cy + 95)], fill=rc, width=3)

    elif "ngu_than" in g_type:
        # Fitted lapel robe (Áo ngũ thân tay chẽn)
        draw.polygon([(cx - 26, cy - 90), (cx + 26, cy - 90), (cx + 55, cy + 95), (cx - 55, cy + 95)], fill=fill_color, outline=stroke_color, width=2)
        # Slim fitted sleeves
        draw.polygon([(cx - 24, cy - 85), (cx - 85, cy + 20), (cx - 70, cy + 30), (cx - 26, cy - 35)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx + 24, cy - 85), (cx + 85, cy + 20), (cx + 70, cy + 30), (cx + 26, cy - 35)], fill=fill_color, outline=stroke_color, width=2)
        # Curved right lapel (vạt hữu thiên)
        draw.line([(cx - 10, cy - 88), (cx + 22, cy - 50)], fill=(240, 235, 225), width=2)
        draw.line([(cx + 22, cy - 50), (cx + 22, cy + 95)], fill=(240, 235, 225), width=2)

    elif "giao_linh" in g_type:
        # Cross collar robe (Áo Giao Lĩnh thời Lê)
        draw.polygon([(cx - 28, cy - 85), (cx + 28, cy - 85), (cx + 65, cy + 95), (cx - 65, cy + 95)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx - 26, cy - 80), (cx - 110, cy), (cx - 95, cy + 40), (cx - 30, cy - 25)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx + 26, cy - 80), (cx + 110, cy), (cx + 95, cy + 40), (cx + 30, cy - 25)], fill=fill_color, outline=stroke_color, width=2)
        # Overlapping V-collar
        draw.line([(cx - 28, cy - 85), (cx + 20, cy - 20)], fill=(245, 240, 230), width=3)
        draw.line([(cx + 28, cy - 85), (cx - 15, cy - 35)], fill=(245, 240, 230), width=3)

    elif "tu_than" in g_type:
        # Four-panel dress with inner halter (Áo Tứ Thân & Yếm đào)
        draw.polygon([(cx - 25, cy - 85), (cx + 25, cy - 85), (cx + 50, cy + 95), (cx - 50, cy + 95)], fill=fill_color, outline=stroke_color, width=2)
        # Rose-pink halter (Yếm đào)
        draw.polygon([(cx, cy - 75), (cx - 20, cy - 35), (cx + 20, cy - 35)], fill=(219, 112, 147))
        # Front tied sashes
        draw.line([(cx, cy - 35), (cx - 15, cy + 85)], fill=fill_color, width=4)
        draw.line([(cx, cy - 35), (cx + 15, cy + 85)], fill=fill_color, width=4)

    elif "quan" in g_type or "jeans" in g_type:
        # Flowing pants / trousers
        draw.polygon([(cx - 38, cy - 85), (cx + 38, cy - 85), (cx + 46, cy + 95), (cx + 8, cy + 95), (cx, cy - 10), (cx - 8, cy + 95), (cx - 46, cy + 95)], fill=fill_color, outline=stroke_color, width=2)
        # Center fold line
        draw.line([(cx - 25, cy - 80), (cx - 28, cy + 95)], fill=(255, 255, 255, 100), width=1)
        draw.line([(cx + 25, cy - 80), (cx + 28, cy + 95)], fill=(255, 255, 255, 100), width=1)

    elif "man" in g_type or "khan_dong" in g_type:
        # Imperial turban / headdress (Mấn & Khăn Đóng)
        # Concentric oval wrap
        for i in range(5, 0, -1):
            w, h = 80 + i * 10, 50 + i * 8
            draw.ellipse([cx - w, cy - h, cx + w, cy + h], outline=stroke_color, fill=fill_color if i == 1 else None, width=2)
        draw.ellipse([cx - 45, cy - 25, cx + 45, cy + 25], fill=(240, 235, 225), outline=stroke_color, width=2)

    elif "non_quai_thao" in g_type:
        # Wide circular folk hat (Nón quai thao)
        draw.ellipse([cx - 110, cy - 35, cx + 110, cy + 35], fill=fill_color, outline=stroke_color, width=2)
        draw.ellipse([cx - 40, cy - 15, cx + 40, cy + 15], fill=(245, 240, 225), outline=stroke_color, width=1)
        # Hanging silk straps (Quai thao tơ tằm)
        draw.line([(cx - 35, cy), (cx - 25, cy + 100)], fill=(178, 34, 34), width=3)
        draw.line([(cx + 35, cy), (cx + 25, cy + 100)], fill=(178, 34, 34), width=3)

    elif "sneaker" in g_type:
        # Minimalist modern sneaker outline
        draw.polygon([(cx - 85, cy + 25), (cx - 70, cy - 15), (cx - 20, cy - 25), (cx + 35, cy - 10), (cx + 80, cy + 15), (cx + 85, cy + 35), (cx - 85, cy + 35)], fill=fill_color, outline=stroke_color, width=2)
        # Sole & laces
        draw.line([(cx - 85, cy + 35), (cx + 85, cy + 35)], fill=(180, 180, 180), width=6)
        draw.line([(cx - 15, cy - 20), (cx + 25, cy - 8)], fill=(120, 120, 120), width=2)

    elif "guoc" in g_type:
        # Traditional wooden clogs
        draw.polygon([(cx - 70, cy + 15), (cx - 50, cy - 10), (cx + 60, cy - 10), (cx + 70, cy + 15)], fill=fill_color, outline=stroke_color, width=2)
        # High heels and red strap
        draw.rectangle([cx - 60, cy + 15, cx - 40, cy + 45], fill=(139, 69, 19))
        draw.rectangle([cx + 35, cy + 15, cx + 55, cy + 45], fill=(139, 69, 19))
        draw.arc([cx - 30, cy - 35, cx + 30, cy + 15], 180, 360, fill=(178, 34, 34), width=4)

    elif "tote" in g_type:
        # Canvas tote bag
        draw.rectangle([cx - 65, cy - 35, cx + 65, cy + 75], fill=fill_color, outline=stroke_color, width=2)
        # Strap handles
        draw.arc([cx - 40, cy - 80, cx + 40, cy], 180, 360, fill=stroke_color, width=3)
        # Dong ho folk print circle on bag
        draw.ellipse([cx - 30, cy - 10, cx + 30, cy + 50], outline=(178, 34, 34), width=2)

    elif "quat" in g_type:
        # Traditional fan
        draw.pieslice([cx - 100, cy - 70, cx + 100, cy + 130], 210, 330, fill=fill_color, outline=stroke_color, width=2)
        # Ribs & tassel
        for a in range(220, 330, 20):
            draw.pieslice([cx - 100, cy - 70, cx + 100, cy + 130], a, a + 2, fill=(245, 235, 215))
        draw.line([(cx, cy + 30), (cx, cy + 90)], fill=(178, 34, 34), width=3)

    elif "kinh" in g_type:
        # Round retro sunglasses
        draw.ellipse([cx - 65, cy - 25, cx - 15, cy + 25], fill=(30, 30, 30), outline=(218, 165, 32), width=3)
        draw.ellipse([cx + 15, cy - 25, cx + 65, cy + 25], fill=(30, 30, 30), outline=(218, 165, 32), width=3)
        draw.line([(cx - 15, cy), (cx + 15, cy)], fill=(218, 165, 32), width=3)
        draw.line([(cx - 65, cy), (cx - 95, cy - 10)], fill=(218, 165, 32), width=2)
        draw.line([(cx + 65, cy), (cx + 95, cy - 10)], fill=(218, 165, 32), width=2)

    elif "vien_linh" in g_type:
        # Round collar robe (Áo Viên Lĩnh)
        draw.polygon([(cx - 28, cy - 85), (cx + 28, cy - 85), (cx + 70, cy + 95), (cx - 70, cy + 95)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx - 26, cy - 80), (cx - 110, cy), (cx - 95, cy + 40), (cx - 30, cy - 25)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx + 26, cy - 80), (cx + 110, cy), (cx + 95, cy + 40), (cx + 30, cy - 25)], fill=fill_color, outline=stroke_color, width=2)
        draw.ellipse([cx - 20, cy - 95, cx + 20, cy - 65], outline=(245, 240, 230), width=3)
        draw.line([(cx + 15, cy - 75), (cx + 35, cy - 50)], fill=(245, 240, 230), width=2)

    elif "doi_kham" in g_type:
        # Symmetrical parallel lapel robe (Áo Đối Khâm)
        draw.polygon([(cx - 28, cy - 85), (cx + 28, cy - 85), (cx + 65, cy + 95), (cx - 65, cy + 95)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx - 26, cy - 80), (cx - 110, cy - 10), (cx - 90, cy + 40), (cx - 32, cy - 20)], fill=fill_color, outline=stroke_color, width=2)
        draw.polygon([(cx + 26, cy - 80), (cx + 110, cy - 10), (cx + 90, cy + 40), (cx + 32, cy - 20)], fill=fill_color, outline=stroke_color, width=2)
        draw.line([(cx - 10, cy - 85), (cx - 10, cy + 95)], fill=(245, 240, 230), width=3)
        draw.line([(cx + 10, cy - 85), (cx + 10, cy + 95)], fill=(245, 240, 230), width=3)

    elif "ao_lot" in g_type or "trung_don" in g_type:
        # Inner robe (Áo Trung Đơn)
        draw.polygon([(cx - 24, cy - 85), (cx + 24, cy - 85), (cx + 50, cy + 95), (cx - 50, cy + 95)], fill=(245, 243, 238), outline=(210, 205, 195), width=2)
        draw.polygon([(cx - 22, cy - 80), (cx - 95, cy + 10), (cx - 80, cy + 30), (cx - 26, cy - 30)], fill=(245, 243, 238), outline=(210, 205, 195), width=2)
        draw.polygon([(cx + 22, cy - 80), (cx + 95, cy + 10), (cx + 80, cy + 30), (cx + 26, cy - 30)], fill=(245, 243, 238), outline=(210, 205, 195), width=2)
        draw.line([(cx - 22, cy - 85), (cx + 15, cy - 25)], fill=(225, 220, 210), width=2)
        draw.line([(cx + 22, cy - 85), (cx - 12, cy - 38)], fill=(225, 220, 210), width=2)

    elif "thuong_quay" in g_type or "chan_vay" in g_type:
        # Traditional pleated wrap skirt
        draw.polygon([(cx - 30, cy - 70), (cx + 30, cy - 70), (cx + 60, cy + 95), (cx - 60, cy + 95)], fill=fill_color, outline=stroke_color, width=2)
        draw.rectangle([cx - 32, cy - 75, cx + 32, cy - 65], fill=(245, 240, 225), outline=stroke_color, width=1)
        for px in range(cx - 40, cx + 45, 16):
            draw.line([(px, cy - 65), (int(cx + (px - cx) * 1.3), cy + 95)], fill=stroke_color, width=1)

    elif "hai" in g_type:
        # Traditional curved embroidered shoes
        draw.polygon([(cx - 65, cy + 10), (cx - 50, cy - 15), (cx + 40, cy - 15), (cx + 65, cy - 5), (cx + 68, cy + 15), (cx - 65, cy + 15)], fill=fill_color, outline=stroke_color, width=2)
        draw.arc([cx + 50, cy - 20, cx + 72, cy + 10], 0, 180, fill=(218, 165, 32), width=3)
        draw.ellipse([cx, cy - 5, cx + 15, cy + 5], fill=(218, 165, 32))

    elif "o_giay" in g_type or "du" in g_type:
        # Traditional oiled paper umbrella
        draw.chord([cx - 85, cy - 70, cx + 85, cy + 40], 180, 360, fill=fill_color, outline=stroke_color, width=2)
        for a in range(200, 350, 25):
            rad = a * 3.14159 / 180
            draw.line([(cx, cy - 15), (cx + int(85 * (rad/2)), cy - 15 - int(55 * abs(rad - 4.71)))], fill=stroke_color, width=1)
        draw.line([(cx, cy - 15), (cx, cy + 90)], fill=(120, 75, 40), width=4)
        draw.arc([cx - 10, cy + 85, cx + 10, cy + 105], 0, 180, fill=(120, 75, 40), width=4)

    elif "tram" in g_type:
        # Hairpin with jade drop and tassel
        draw.line([(cx - 70, cy + 60), (cx + 50, cy - 60)], fill=(218, 165, 32), width=4)
        draw.ellipse([cx + 40, cy - 75, cx + 70, cy - 45], fill=fill_color, outline=(218, 165, 32), width=2)
        draw.line([(cx + 55, cy - 45), (cx + 55, cy + 20)], fill=(178, 34, 34), width=2)
        draw.ellipse([cx + 52, cy + 18, cx + 58, cy + 26], fill=(218, 165, 32))

    elif "chuoi_ngoc" in g_type or "vong_co" in g_type:
        # Pearl / Jade beaded necklace
        import math
        for deg in range(0, 360, 24):
            rad = math.radians(deg)
            bx = cx + int(55 * math.cos(rad))
            by = cy + int(45 * math.sin(rad))
            draw.ellipse([bx - 6, by - 6, bx + 6, by + 6], fill=fill_color, outline=(200, 190, 180), width=1)

    else:
        # Default elegant Eastern urn / emblem
        draw.ellipse([cx - 60, cy - 60, cx + 60, cy + 60], fill=fill_color, outline=stroke_color, width=2)


def generate_placeholder_image(output_path: Path, title: str, color_name: str, era: str, g_type: str, is_traditional: bool):
    """Generate a high-end, minimalist Eastern art gallery card."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    width, height = 640, 640
    base_color = COLOR_MAP.get(color_name, (100, 95, 90))

    # 1. Warm Xuan Paper / Rice Paper Background (#F9F6F0)
    img = Image.new("RGB", (width, height), (249, 246, 240))
    draw = ImageDraw.Draw(img)

    # 2. Subtle Antique Double Hairline Border (#DDD4C5)
    border_color = (222, 212, 197)
    draw.rectangle([24, 24, width - 24, height - 24], outline=border_color, width=1)
    draw.rectangle([28, 28, width - 28, height - 28], outline=border_color, width=1)

    # Corner decorative brackets
    bracket_len = 16
    draw.line([(24, 24), (24 + bracket_len, 24)], fill=(175, 155, 130), width=2)
    draw.line([(24, 24), (24, 24 + bracket_len)], fill=(175, 155, 130), width=2)
    draw.line([(width - 24, 24), (width - 24 - bracket_len, 24)], fill=(175, 155, 130), width=2)
    draw.line([(width - 24, 24), (width - 24, 24 + bracket_len)], fill=(175, 155, 130), width=2)
    draw.line([(24, height - 24), (24 + bracket_len, height - 24)], fill=(175, 155, 130), width=2)
    draw.line([(24, height - 24), (24, height - 24 - bracket_len)], fill=(175, 155, 130), width=2)
    draw.line([(width - 24, height - 24), (width - 24 - bracket_len, height - 24)], fill=(175, 155, 130), width=2)
    draw.line([(width - 24, height - 24), (width - 24, height - 24 - bracket_len)], fill=(175, 155, 130), width=2)

    # 3. Soft Zen Halo in Center
    cx, cy = 320, 245
    draw.ellipse([cx - 145, cy - 145, cx + 145, cy + 145], fill=(242, 237, 227), outline=(232, 225, 212), width=1)

    # 4. Stylized Silhouette
    draw_garment_silhouette(draw, g_type, cx, cy, base_color)

    # 5. Traditional Vermilion Red Seal Stamp (Con dấu triện son đỏ)
    seal_x, seal_y = 520, 75
    seal_char = "CỔ" if is_traditional else "TÂN"
    draw.rectangle([seal_x - 20, seal_y - 20, seal_x + 20, seal_y + 20], fill=(166, 43, 43))
    draw.rectangle([seal_x - 17, seal_y - 17, seal_x + 17, seal_y + 17], outline=(250, 240, 235), width=1)
    draw.text((seal_x, seal_y), seal_char, fill=(250, 240, 235), font=FONT_SEAL, anchor="mm")

    # 6. Small vertical badge next to seal
    seal_label = "DI SẢN" if is_traditional else "REMIX"
    draw.text((seal_x, seal_y + 32), seal_label, fill=(150, 140, 130), font=FONT_TAG, anchor="mm")

    # 7. Editorial Typography at bottom
    # Title in serif
    draw.text((320, 455), title, fill=(45, 42, 39), font=FONT_TITLE, anchor="mm")

    # Subtitle details (Era • Category • Color)
    era_text = "Triều Nguyễn" if era == "nguyen" else ("Thời Lê" if era == "le" else ("Dân gian" if era == "folk" else "Đương đại"))
    info_line = f"{era_text}  •  Sắc {color_name}"
    draw.text((320, 495), info_line, fill=(135, 125, 115), font=FONT_SUB, anchor="mm")

    # Delicate divider line
    draw.line([(260, 525), (380, 525)], fill=(215, 205, 190), width=1)
    draw.ellipse([318, 523, 322, 527], fill=(166, 43, 43))

    # Poetic footer
    footer_text = "VIỆT PHỤC REMIX  •  DI SẢN TRUYỀN THỐNG"
    draw.text((320, 555), footer_text, fill=(160, 150, 138), font=FONT_TAG, anchor="mm")

    img.save(output_path, "PNG", quality=95)


async def seed_database(force_regenerate_images: bool = False):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    from app.database import Base, engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        has_legacy_garments = await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).has_table("garments")
        )

    async with async_session_maker() as session:
        db_types = {
            row.type_id: row
            for row in (await session.execute(select(GarmentType))).scalars().all()
        }
        db_garments = {g.id: g for g in (await session.execute(select(Garment))).scalars().all()}
        existing_rules_count = (await session.execute(select(CulturalRule))).scalars().first()

        with open(SEED_DIR / "garment_types.json", encoding="utf-8") as f:
            type_data = json.load(f)
        for item in type_data:
            type_id = item["type_id"]
            if type_id in db_types:
                continue
            garment_type = GarmentType(
                type_id=type_id,
                name_vi=item["name_vi"],
                name_en=item.get("name_en"),
                category=item["category"],
                subtype=item.get("subtype"),
                era=item.get("era"),
                region=item.get("region"),
                gender_fit=item.get("gender_fit", "unisex"),
                cultural_tier=item.get("cultural_tier"),
                formality=item.get("formality"),
                cultural_description=item.get("cultural_description"),
                historical_lore=item.get("historical_lore"),
                cultural_notes=item.get("cultural_notes"),
                rules=item.get("rules", []),
                is_traditional=item.get("is_traditional", True),
                remix_tags=item.get("remix_tags", []),
                compatible_occasions=item.get("compatible_occasions", []),
            )
            session.add(garment_type)
            db_types[type_id] = garment_type

        legacy_rows = {}
        if has_legacy_garments:
            legacy_rows = {
                row["id"]: row
                for row in (await session.execute(text("SELECT * FROM garments"))).mappings().all()
            }

        with open(SEED_DIR / "inventory_items.json", encoding="utf-8") as f:
            inventory_data = json.load(f)
        for item in inventory_data:
            item_id = item["item_id"]
            parent_type_id = item["parent_type_id"]
            if parent_type_id not in db_types:
                raise ValueError(f"Unknown garment type: {parent_type_id}")
            if item_id in db_garments:
                continue

            legacy = legacy_rows.get(item_id)
            garment = Garment(
                id=item_id,
                parent_type_id=parent_type_id,
                display_name=item["display_name"],
                display_name_en=item.get("display_name_en"),
                image_path=item["image_path"],
                thumbnail_path=item.get("thumbnail_path", item["image_path"]),
                primary_color=item.get("primary_color"),
                colors=item.get("colors", []),
                pattern=item.get("pattern"),
                material=item.get("material"),
                is_preset=item.get("is_preset", True),
                rental_price_per_day=(legacy["rental_price_per_day"] if legacy else item.get("rental_price_per_day")),
                deposit_per_item=(legacy["deposit_per_item"] if legacy else item.get("deposit_per_item")),
                available_sizes=(json.loads(legacy["available_sizes"]) if legacy and legacy["available_sizes"] else item.get("available_sizes", [])),
                stock_quantity=(legacy["stock_quantity"] if legacy else item.get("stock_quantity", 1)),
            )
            session.add(garment)
            db_garments[item_id] = garment

            image_file = DATA_DIR / item["image_path"].lstrip("/\\")
            if force_regenerate_images or not image_file.exists():
                garment_type = db_types[parent_type_id]
                generate_placeholder_image(
                    image_file,
                    title=item["display_name"],
                    color_name=item.get("primary_color", "Màu tự nhiên"),
                    era=garment_type.era or "nguyen",
                    g_type=parent_type_id,
                    is_traditional=garment_type.is_traditional,
                )

        # 2. Seed Cultural Rules if not present
        if not existing_rules_count:
            rules_file = SEED_DIR / "cultural_rules.json"
            if rules_file.exists():
                with open(rules_file, "r", encoding="utf-8") as f:
                    rules_data = json.load(f)
                for r in rules_data:
                    rule = CulturalRule(
                        rule_type=r["rule_type"],
                        condition=r["condition"],
                        message_vi=r["message_vi"],
                        severity=r.get("severity", "warning"),
                    )
                    session.add(rule)

        await session.commit()
        logger.info("Database and aesthetic traditional placeholder images ready!")


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_database(force_regenerate_images=True))

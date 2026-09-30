# VietDrobe

> Nền tảng số hóa, trải nghiệm thời trang di sản và dịch vụ cho thuê cổ phục Việt Nam thông minh dành cho thế hệ trẻ, tích hợp  Stylist,và hệ thống thẩm định chuẩn mực văn hóa.

---

## 1. Tổng Quan 

**VietDrobe** là giải pháp toàn diện kết nối kho tàng di sản trang phục truyền thống Việt Nam (thời Lê, Nguyễn, dân gian Bắc Bộ...) với văn hóa thời trang đời thường và nhu cầu thực tế của giới trẻ:
1. **Khảo cứu & chiêm ngưỡng di sản**: Tiếp cận thông tin chuẩn xác về phom dáng, hoa văn, điển tích, niên đại và ý nghĩa của 17 cổ phục tiêu biểu.
2. **Sáng tạo & phối đồ đa phong cách**: Phối ngẫu linh hoạt cổ phục (Áo Tấc, Nhật Bình, Ngũ Thân, Giao Lĩnh...) cùng phụ kiện hiện đại (Sneaker, Jeans ống suông, Túi tote Đông Hồ, Kính râm retro) theo bối cảnh sự kiện thực tế (Tết, Kỷ yếu, Dạo phố, Dạ tiệc, Lễ hội).
3. **Bảo tồn chuẩn mực**: Đảm bảo tính tôn nghiêm và giá trị cội nguồn nhờ thuật toán tự động kiểm định văn hóa, ngăn ngừa các lỗi sai phạm phẩm hàm, giới tính, niên đại hoặc thuần phong mỹ tục.
4. **Dịch vụ cho thuê cổ phục thông minh**: Tích hợp hoàn chỉnh mô hình kinh doanh cho thuê trang phục di sản, cho phép chọn size, số lượng, ngày thuê, tự động tính giá linh hoạt, chiết khấu combo 15% cho set đồ AI và quản lý đơn đặt cọc minh bạch.

---

## 2. Tính Năng Nổi Bật

### Tủ Đồ Di Sản & Kho Phục Trang Cho Thuê 
- **17 phục trang chuẩn hóa**: Chia theo nhóm chi tiết (*Áo Cổ Phục, Quần & Váy Lụa, Mấn & Nón, Guốc & Sneaker, Phụ Kiện*).

### AI Stylist
- **Phối đồ theo bối cảnh**: 5 sự kiện (*Tết, Kỷ yếu, Dạo phố, Lễ hội, Hỷ sự*) kết hợp 4 phong cách (*Streetwear, Minimalist, Y2K Folk-Fusion, Cổ phong thanh lịch*).
- **Bảo chứng văn hóa & Báo giá**: Tự động đánh giá độ hài hòa màu sắc (Color Harmony), điểm bảo chứng văn hóa (Cultural Integrity) và ước tính tổng chi phí thuê set đồ.
- **Fallback Heuristic Engine**: Cơ chế dự phòng nội suy thông minh, đảm bảo **luôn luôn trả về 3 công thức phối đồ hoàn chỉnh** ngay cả khi không có kết nối Internet hoặc chưa cấu hình AI API Key.
- **Hỗ trợ ghim món đồ (Pinned Garments)**: Cố định một hoặc nhiều món yêu thích làm tâm điểm cho mọi gợi ý.

### Mix & Match Studio Canvas 
- **Không gian phối đồ trực quan**: Kéo thả, chọn lọc trang phục tự do trên nền Canvas mỹ thuật.
- **Thẩm định tức thời**: Phân tích sự tương thích khi chọn từ 2 món trở lên và cảnh báo vi phạm ngay lập tức.
- **Chuyển giỏ thuê 1-Click (Rental Modal)**: Nhanh chóng đưa cả bộ đồ đang phối vào giỏ thuê.

---

## 3. Kiến Trúc Kỹ Thuật (Tech Stack)

| Thành phần | Công nghệ sử dụng | Vai trò |
|---|---|---|
| **Frontend** | Next.js 16 (Turbopack, App Router) | Giao diện SSR/SSG hiện đại, tối ưu SEO và hiệu năng cao |
| **Styling** | Tailwind CSS v4 + Custom Eastern Variant | Hệ thống bảng màu Á Đông cổ điển, responsive toàn diện |
| **State & Context** | React Context (`rental-context`) | Quản lý giỏ hàng thuê đồ và tính toán tức thời ở client |
| **Icons** | Lucide React | Hệ thống biểu tượng tối giản |
| **Backend** | FastAPI + Uvicorn | High-performance Asynchronous Python REST API |
| **ORM / DB** | SQLAlchemy 2.0 (Async) + aiosqlite | Quản lý dữ liệu bất đồng bộ (Garments, CulturalRules, Rentals, Bookings) |
| **Validation** | Pydantic v2 | Kiểm định dữ liệu vào/ra nghiêm ngặt |
| **Image Engine** | Pillow (PIL) | Sinh thẻ tranh di sản truyền thống và hoa văn tự động |
| **Container** | Docker & Docker Compose | Đóng gói và triển khai môi trường đồng nhất |

### Mô hình dữ liệu kho phục trang

Kho được tách thành hai lớp để không lặp tri thức văn hóa giữa các biến thể:

| Lớp | Nguồn dữ liệu | Nội dung |
|---|---|---|
| `GarmentType` | `backend/app/seed/garment_types.json` | `type_id`, tên gọi, niên đại, tri thức lịch sử, quy tắc văn hóa và metadata RAG. Mỗi loại chỉ có một bản ghi. |
| `InventoryItem` | `backend/app/seed/inventory_items.json` | `item_id`, `parent_type_id`, ảnh, màu, chất liệu, size, giá, tiền cọc và tồn kho của SKU thực tế. |

Ví dụ: `ao_tac` là một `GarmentType`; `garment-ao-tac-do` và `garment-ao-tac-xanh` là hai `InventoryItem` cùng tham chiếu về loại này. RAG chỉ cần embed `GarmentType`.

---

## 4. Danh Sách API Endpoints Chính

| Phương thức | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/v1/health` | Kiểm tra trạng thái hoạt động của hệ thống |
| `GET` | `/api/v1/garments` | Danh sách toàn bộ phục trang kèm thông tin văn hóa & giá thuê |
| `GET` | `/api/v1/garment-types` | Tri thức văn hóa dùng chung theo loại trang phục |
| `GET` | `/api/v1/garments/{id}` | Chi tiết một món phục trang di sản |
| `POST` | `/api/v1/cultural/check` | Thẩm định độ tương thích văn hóa của set đồ (Cultural Guardrail) |
| `POST` | `/api/v1/outfits/suggest` | Gợi ý 3 công thức phối đồ theo bối cảnh qua AI hoặc Heuristic Fallback |
| `POST` | `/api/v1/chat` | Trợ lý hội thoại AI đa lượt (hỗ trợ ngữ cảnh Canvas & tư vấn giá thuê) |
| `GET` | `/api/v1/rentals/catalog` | Danh mục phục trang cho thuê cùng phân loại size và tồn kho |
| `POST` | `/api/v1/rentals/calculate` | Tính toán tiền thuê, chiết khấu Combo 15% và tiền cọc theo số ngày |
| `POST` | `/api/v1/rentals/book` | Tạo đơn đặt thuê mới và lưu trữ vào database |
| `GET` | `/api/v1/rentals/booking/{id}` | Tra cứu chi tiết đơn thuê theo mã booking |

---

## 5. Quickstart

### Cách 1: 1-Click

- **Khởi chạy**: Nhấp đúp chuột vào file **`start.bat`**. Script tự kiểm tra môi trường, cài đặt dependencies nếu thiếu, khởi chạy song song Backend + Frontend và tự động mở trình duyệt.

---

### Cách 2: Sử dụng Docker Compose

Yêu cầu máy đã cài đặt [Docker Desktop](https://www.docker.com/).

```bash
# Khởi chạy toàn bộ hệ thống (Frontend + Backend + Tự động seed DB)
docker compose up --build
```

Sau khi khởi chạy thành công:
- **Giao diện người dùng (Frontend)**: [http://localhost:3000](http://localhost:3000)
  - Khảo cứu di sản: `/catalog`
  - Gợi ý AI Stylist: `/suggest`
  - Studio phối đồ: `/studio`
  - Đặt thuê trang phục: `/rent`
- **Tài liệu API Swagger (Backend)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### Cách 3: Khởi chạy thủ công từng dịch vụ

#### Yêu cầu tiên quyết:
- **Python**: Phiên bản 3.11 hoặc 3.12
- **Node.js**: Phiên bản 18 trở lên (khuyên dùng Node 20 LTS)

#### Bước 1: Khởi động Backend

```bash
cd backend

# Tạo và kích hoạt virtual environment (tùy chọn)
py -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1

# Cài đặt thư viện
py -m pip install -r requirements.txt

# Khởi chạy server FastAPI (tự động tạo database và ảnh placeholder)
py -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

> *Ghi chú:* Để tích hợp OpenAI/LLM thực tế, tạo file `backend/.env` từ `.env.example` và điền `AI_API_KEY`. Nếu không có API Key, hệ thống sẽ tự động chuyển sang Fallback Heuristic Engine mà không gặp lỗi.

#### Bước 2: Khởi động Frontend

Mở một cửa sổ Terminal mới:

```bash
cd frontend

# Cài đặt dependencies
npm install

# Khởi chạy dev server Next.js
npm run dev
```

Truy cập trình duyệt tại: **`http://localhost:3000`**.

---

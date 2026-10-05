# VietDrobe

> Nền tảng số hóa, trải nghiệm thời trang di sản và dịch vụ cho thuê cổ phục Việt Nam dành cho thế hệ trẻ, với tìm kiếm ngữ nghĩa và thẩm định chuẩn mực văn hóa.

---

## 1. Tổng Quan 

**VietDrobe** là giải pháp toàn diện kết nối kho tàng di sản trang phục truyền thống Việt Nam (thời Lê, Nguyễn, dân gian Bắc Bộ...) với văn hóa thời trang đời thường và nhu cầu thực tế của giới trẻ:
1. **Khảo cứu & chiêm ngưỡng di sản**: Tiếp cận thông tin chuẩn xác về phom dáng, hoa văn, điển tích, niên đại và ý nghĩa của 17 cổ phục tiêu biểu.
2. **Sáng tạo & phối đồ đa phong cách**: Phối ngẫu linh hoạt cổ phục (Áo Tấc, Nhật Bình, Ngũ Thân, Giao Lĩnh...) cùng phụ kiện hiện đại (Sneaker, Jeans ống suông, Túi tote Đông Hồ, Kính râm retro) theo bối cảnh sự kiện thực tế (Tết, Kỷ yếu, Dạo phố, Dạ tiệc, Lễ hội).
3. **Bảo tồn chuẩn mực**: Đảm bảo tính tôn nghiêm và giá trị cội nguồn nhờ thuật toán tự động kiểm định văn hóa, ngăn ngừa các lỗi sai phạm phẩm hàm, giới tính, niên đại hoặc thuần phong mỹ tục.
4. **Dịch vụ cho thuê cổ phục**: Tích hợp mô hình cho thuê trang phục di sản, cho phép chọn size, số lượng, ngày thuê, tính giá, chiết khấu combo 15% và quản lý tiền đặt cọc.

---

## 2. Tính Năng Nổi Bật

### Tủ Đồ Di Sản & Kho Phục Trang Cho Thuê 
- **17 phục trang chuẩn hóa**: Chia theo nhóm chi tiết (*Áo Cổ Phục, Quần & Váy Lụa, Mấn & Nón, Guốc & Sneaker, Phụ Kiện*).

### Tìm Kiếm Trang Phục Theo Ngữ Nghĩa
- **Tìm theo bối cảnh và phong cách**: Quiz kết hợp dịp diện, phong cách, giới tính và món đồ ghim thành truy vấn để tìm các mẫu gần nghĩa trong kho.
- **Embeddings hai lớp dữ liệu**: Mỗi SKU vật lý được embed cùng thông tin văn hóa từ loại trang phục cha; kết quả trả về ảnh và thông tin của SKU tương ứng.
- **Chạy cục bộ, không cần API key**: Embeddings được dựng sẵn bằng SentenceTransformer và lưu trong `embeddings.json`; ChromaDB tìm kiếm vector khi chạy. Không dùng LLM, không cần tải model khi sử dụng bình thường.
- **Gợi ý theo bộ**: Vector search lấy các SKU phù hợp; hệ thống ghép món chính với quần/váy phù hợp và kiểm tra quy tắc văn hóa trước khi hiển thị bộ trang phục. Đây là bước phối theo danh mục và quy tắc, không phải outfit mẫu cố định.
- **Hỗ trợ ghim món đồ**: Món được ghim được giữ trong mỗi bộ gợi ý hợp lệ khi còn hàng.
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
| **Semantic Search** | SentenceTransformers + ChromaDB | Embeddings dựng sẵn (`embeddings.json`), truy xuất SKU theo độ tương đồng ngữ nghĩa |
| **Container** | Docker & Docker Compose | Đóng gói và triển khai môi trường đồng nhất |

### Mô hình dữ liệu kho phục trang

Kho được tách thành hai lớp để không lặp tri thức văn hóa giữa các biến thể:

| Lớp | Nguồn dữ liệu | Nội dung |
|---|---|---|
| `GarmentType` | `backend/app/seed/garment_types.json` | `type_id`, tên gọi, niên đại, tri thức lịch sử, quy tắc văn hóa và metadata RAG. Mỗi loại chỉ có một bản ghi. |
| `InventoryItem` | `backend/app/seed/inventory_items.json` | `item_id`, `parent_type_id`, ảnh, màu, chất liệu, size, giá, tiền cọc và tồn kho của SKU thực tế. |

Ví dụ: `ao_tac` là một `GarmentType`; `garment-ao-tac-do` và `garment-ao-tac-xanh` là hai `InventoryItem` cùng tham chiếu về loại này. Mỗi `InventoryItem` được embed riêng cùng thông tin từ `GarmentType` cha để tìm được đúng biến thể mà vẫn giữ tri thức văn hóa.

---

## 4. Danh Sách API Endpoints Chính

| Phương thức | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/v1/health` | Kiểm tra trạng thái hoạt động của hệ thống |
| `GET` | `/api/v1/garments` | Danh sách toàn bộ phục trang kèm thông tin văn hóa & giá thuê |
| `GET` | `/api/v1/garment-types` | Tri thức văn hóa dùng chung theo loại trang phục |
| `GET` | `/api/v1/garments/{id}` | Chi tiết một món phục trang di sản |
| `POST` | `/api/v1/cultural/check` | Thẩm định độ tương thích văn hóa của set đồ (Cultural Guardrail) |
| `POST` | `/api/v1/outfits/suggest` | Tìm SKU bằng semantic search, ghép thành bộ theo danh mục và kiểm tra quy tắc văn hóa |
| `POST` | `/api/v1/chat` | Tìm SKU bằng mô tả ngữ nghĩa, có thể kết hợp ngữ cảnh Canvas |
| `GET` | `/api/v1/rentals/catalog` | Danh mục phục trang cho thuê cùng phân loại size và tồn kho |
| `POST` | `/api/v1/rentals/calculate` | Tính toán tiền thuê, chiết khấu Combo 15% và tiền cọc theo số ngày |
| `POST` | `/api/v1/rentals/book` | Tạo đơn đặt thuê mới và lưu trữ vào database |
| `GET` | `/api/v1/rentals/booking/{id}` | Tra cứu chi tiết đơn thuê theo mã booking |

---

## 5. Quickstart

### Cách 1 (recommend): 1-Click

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
  - Tìm trang phục theo ngữ nghĩa: `/suggest`
  - Đặt thuê trang phục: `/rent`
- **Tài liệu API Swagger (Backend)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### Cách 3: Khởi chạy thủ công từng dịch vụ

#### Yêu cầu tiên quyết:
- **Python**: Phiên bản 3.11 hoặc 3.12 (chưa khuyến nghị 3.13/3.14 vì một số thư viện như torch có thể chưa có bản dựng sẵn; nếu máy có nhiều bản Python, dùng `py -3.12`)
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

> *Embeddings dựng sẵn:* Vector của 25 SKU và 60 tổ hợp truy vấn cố định được lưu trong `backend/app/seed/embeddings.json` (commit lên git). Khi khởi động, backend nạp file này vào ChromaDB mà **không cần tải hay load model**, nên chạy được ngay sau khi pull. Chỉ khi sửa `garment_types.json`, `inventory_items.json`, `OCCASION_QUERY` hoặc `STYLE_QUERY` mới cần dựng lại (cần model, tải một lần):
>
> ```bash
> cd backend
> py -m scripts.build_embeddings          # dựng lại embeddings.json rồi commit
> py -m scripts.build_embeddings --check  # kiểm tra file còn khớp dữ liệu không (exit 1 nếu cũ)
> ```

> *Ghi chú:* Không cần API key. ChromaDB lưu chỉ mục dưới `backend/data/chroma` (tự tạo, không commit) và được nạp từ `embeddings.json` mỗi khi backend khởi động, mất khoảng một giây. Model chỉ được tải khi bạn chạy `scripts.build_embeddings`, hoặc khi có SKU mới chưa có trong `embeddings.json`. Nếu `embeddings.json` bị thiếu hoặc cũ, `/outfits/suggest` sẽ trả 503 ("đang khởi tạo") cho đến khi bạn dựng lại file.
>
> *Món được ghim:* Vector của món được ghim được trộn vào vector truy vấn (trọng số `PINNED_WEIGHT` trong `rag_service.py`) thay vì nối thêm tên món vào câu truy vấn.

Quiz trang phục dùng semantic vector search trực tiếp. Hệ thống trả về dữ liệu SKU và thông tin văn hóa từ loại cha thay vì sinh câu trả lời hay công thức phối đồ.

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

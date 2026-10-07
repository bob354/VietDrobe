# Phát triển VietDrobe

[← README](../README.md)

## Môi trường

- Python 3.12, cùng phiên bản với Dockerfile backend.
- Node.js **20.9 trở lên** và npm, theo [yêu cầu của Next.js 16](https://nextjs.org/docs/app/getting-started/installation#system-requirements).
- Thư viện backend trong `backend/requirements.txt`; frontend trong `frontend/package.json` và lockfile.

Các lệnh PowerShell dưới đây chạy từ thư mục gốc, trong hai cửa sổ riêng. Không cần API key cho tính năng gợi ý.

## Backend

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend tự tạo thư mục SQLite, tạo bảng, đồng bộ catalog và ảnh, rồi khởi tạo tìm kiếm ngữ nghĩa trong tác vụ nền. `/api/v1/health` xác nhận HTTP server hoạt động; kiểm tra `/api/v1/outfits/suggest` riêng để xác nhận tính năng gợi ý.

Có thể sao chép `backend/.env.example` thành `backend/.env` để thay đổi cấu hình. Không commit `.env`.

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/vietphuc.db` | Database SQLite tương đối với thư mục chạy backend |
| `STORAGE_PATH` | `./data` | Ảnh catalog và chỉ mục Chroma |
| `DEBUG` | `true` | Log chi tiết, Swagger `/docs` và ReDoc `/redoc` |
| `CORS_ORIGINS` | `http://localhost:3000`, `http://localhost:5173` | Khi cấu hình bằng biến môi trường, dùng mảng JSON các origin |

## Frontend

Trong cửa sổ PowerShell thứ hai:

```powershell
cd frontend
npm ci
$env:BACKEND_URL = "http://127.0.0.1:8000"
npm run dev
```

Mở http://localhost:3000. Frontend gọi `/api/v1/*` trên cùng origin; rewrite trong `next.config.ts` chuyển request đến `BACKEND_URL`. Mặc định khi không đặt biến là `http://127.0.0.1:8000`.

## Cập nhật catalog và embeddings

Nguồn dữ liệu nằm trong `backend/app/seed/`:

| File | Nội dung |
|---|---|
| `garment_types.json` | Tri thức và metadata từng loại phục trang |
| `inventory_items.json` | SKU, tham chiếu loại cha, ảnh, giá, size và số lượng |
| `garments/*.png` | Sprite catalog vuông, RGBA, có nền trong suốt |
| `cultural_rules.json` | Quy tắc văn hóa được seed khi bảng quy tắc còn trống |
| `embeddings.json` | Vector phục trang và tổ hợp truy vấn quiz |

Sau khi thay đổi catalog hoặc `OCCASION_QUERY` / `STYLE_QUERY` trong `recommendation_service.py`, chạy từ thư mục `backend/`:

```powershell
.\.venv\Scripts\python.exe -m scripts.build_embeddings
.\.venv\Scripts\python.exe -m scripts.build_embeddings --check
```

Lệnh dựng vector tải model khi chưa có cache, nên cần kết nối mạng và tài nguyên cho SentenceTransformer. Kiểm tra `--check` chỉ so sánh bundle với dữ liệu; không tải model. Commit `embeddings.json` cùng các thay đổi JSON/quiz, rồi triển khai lại backend.

Hiện tại bundle chứa 25 món và 60 tổ hợp (5 dịp × 4 phong cách × 3 giới tính). Chỉ mục Chroma được dựng từ bundle và lưu trong `STORAGE_PATH/chroma`. Khi bundle hợp lệ, các lựa chọn quiz và ghim món dùng vector đã có, không cần tải model trong request.

Ảnh nguồn được đồng bộ vào storage lúc khởi động. Thay đổi riêng pixel ảnh không đổi văn bản embedding; vẫn kiểm tra `--check` trước khi triển khai. Nếu thay đổi quy tắc văn hóa, lưu ý seed không ghi đè tập quy tắc đã có trong database.

## Kiểm tra

Frontend, từ thư mục `frontend/`:

```powershell
npm run lint
npm run build
```

Backend, từ thư mục `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pip install pytest httpx
.\.venv\Scripts\python.exe -m scripts.build_embeddings --check
.\.venv\Scripts\python.exe -m pytest tests -q
```

Các test hiện tại kiểm tra sprite vuông/trong suốt, đồng bộ catalog vẫn giữ bộ phối cũ, phục vụ ảnh và tạo database trong thư mục mới. Số lượng test hoặc số SKU cần cập nhật nếu mở rộng catalog.

## Giữ repository sạch

Commit dữ liệu seed, sprite nguồn và bundle embeddings. Không commit `.env`, database runtime, model cache hoặc chỉ mục Chroma. Các đường dẫn runtime hiện được liệt kê trong `.gitignore`; nếu đổi đường dẫn storage, cập nhật ignore tương ứng.

Ảnh minh họa README nằm trong [`docs/images/`](images/README.md). Cập nhật ảnh khi giao diện thay đổi; chụp dữ liệu và kết quả thật, không chứa thông tin khách hàng.

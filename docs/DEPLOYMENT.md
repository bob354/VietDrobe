# Triển khai Railway + Vercel

[← README](../README.md)

Frontend chạy trên Vercel, backend chạy trên Railway. Trình duyệt gọi `/api/v1/*` qua frontend; Vercel chuyển request đến public domain của Railway bằng `BACKEND_URL`.

## 1. Railway: backend

1. Kết nối repository, chọn branch muốn triển khai và đặt **Root Directory** là `backend`.
2. Sử dụng `backend/Dockerfile`. Lệnh mặc định chạy Uvicorn tại `0.0.0.0` và đọc `PORT` do Railway cấp, hoặc dùng 8000 nếu biến chưa có. Nếu đã đặt Start Command riêng, đảm bảo nó cũng dùng đúng port.
3. Tạo volume, gắn vào service backend với mount path `/app/data`.
4. Đặt các biến sau:

```env
DATABASE_URL=sqlite+aiosqlite:////app/data/vietphuc.db
STORAGE_PATH=/app/data
DEBUG=false
```

Database URL có **bốn dấu `/`** trước `app` vì đây là đường dẫn tuyệt đối trên Linux. Thư mục cha được tạo trước kết nối SQLite; volume giữ database, ảnh và chỉ mục qua các lần triển khai. Volume có sẵn khi container chạy, không có trong bước build hoặc pre-deploy. [Tài liệu Railway volumes](https://docs.railway.com/volumes).

5. Trong **Settings → Networking → Public Networking**, chọn **Generate Domain**. Target port phải trùng port Uvicorn ghi trong deploy log. [Public networking](https://docs.railway.com/networking/public-networking), [Railway PORT](https://docs.railway.com/deployments/healthchecks).
6. Có thể đặt healthcheck path `/api/v1/health`. Apply các thay đổi và triển khai commit mới nhất.

Kiểm tra trực tiếp trong trình duyệt, thay domain minh họa bằng domain service:

```text
https://YOUR-RAILWAY-DOMAIN/api/v1/health
https://YOUR-RAILWAY-DOMAIN/api/v1/garments
```

Health phải trả `status: healthy`; danh mục hiện tại phải có `total: 25`. Health không kiểm tra chất lượng chỉ mục gợi ý.

## 2. Vercel: frontend

1. Kết nối cùng repository, chọn framework Next.js và **Root Directory** là `frontend`.
2. Trong **Environment Variables**, thêm biến loại **Config**, chọn **Production**:

```env
BACKEND_URL=https://YOUR-RAILWAY-DOMAIN
```

Giá trị là public HTTPS origin của backend: không chứa dấu ngoặc kép, khoảng trắng, `/api/v1` hoặc `/health`. Dùng origin không có dấu `/` cuối. Domain nội bộ `*.railway.internal` chỉ dùng trong mạng Railway.

3. Save, rồi triển khai lại frontend. Rewrite được dựng lúc build, nên đổi `BACKEND_URL` phải tạo deployment mới. [Vercel environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables).
4. Nếu dùng Preview, đặt `BACKEND_URL` cho môi trường Preview với backend tương ứng.

## 3. Kiểm tra toàn bộ đường đi

Mở các đường dẫn sau trên **domain Vercel**:

```text
https://YOUR-VERCEL-DOMAIN/api/v1/health
https://YOUR-VERCEL-DOMAIN/api/v1/garments
https://YOUR-VERCEL-DOMAIN/catalog
https://YOUR-VERCEL-DOMAIN/suggest
```

Catalog phải tải được ảnh. Trong quiz, chọn dịp và phong cách rồi tìm trang phục: kiểm tra có bộ phối và ảnh thực tế, không chỉ trạng thái deployment “Ready”. Không cần để máy cá nhân hoặc trình duyệt chạy sau khi hai dịch vụ đã được triển khai.

## Xử lý lỗi thường gặp

| Hiện tượng | Kiểm tra / cách xử lý |
|---|---|
| `unable to open database file` | Đường dẫn SQLite phải tồn tại và ghi được; dùng bản code đã tạo thư mục, biến trên và volume `/app/data` |
| Build frontend báo `Invalid rewrite found` | `BACKEND_URL` phải bắt đầu bằng `https://` hoặc `http://` |
| Railway hoạt động nhưng API qua Vercel trả `Application not found` | Kiểm tra chính xác public domain trong `BACKEND_URL`, rồi redeploy Vercel |
| Railway báo `Application failed to respond` | Kiểm tra trạng thái startup và target port có trùng port Uvicorn không |
| Danh mục có dữ liệu nhưng gợi ý rỗng hoặc lỗi 503 | Kiểm tra log RAG warm-up; chạy `scripts.build_embeddings --check`, dựng lại bundle nếu cũ, commit và redeploy backend |
| `/docs` trả 404 trong production | Bình thường khi `DEBUG=false`; kiểm tra `/api/v1/health` thay thế |

Nếu đổi domain backend, cập nhật `BACKEND_URL` và redeploy frontend. Khi thay đổi catalog/quiz, triển khai dữ liệu cùng bundle embeddings đã kiểm tra. [Quy trình cập nhật](DEVELOPMENT.md#cập-nhật-catalog-và-embeddings).

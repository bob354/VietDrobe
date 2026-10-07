# VietDrobe frontend

Giao diện Next.js cho trang chủ, tủ đồ cổ phục, gợi ý phối đồ và giỏ thuê.

[README dự án](../README.md) · [Thiết lập cục bộ](../docs/DEVELOPMENT.md) · [Triển khai Vercel + Railway](../docs/DEPLOYMENT.md)

## Chạy cục bộ

Yêu cầu Node.js 20.9 trở lên. Khởi động backend tại `http://127.0.0.1:8000` trước, rồi chạy trong thư mục này:

```powershell
npm ci
$env:BACKEND_URL = "http://127.0.0.1:8000"
npm run dev
```

Mở http://localhost:3000. API client dùng `/api/v1`; rewrite trong `next.config.ts` chuyển request đến `BACKEND_URL`.

## Kiểm tra

```bash
npm run lint
npm run build
```

Khi triển khai lên Vercel, đặt Root Directory là `frontend` và `BACKEND_URL` là public HTTPS origin của Railway. Thay đổi biến này cần deployment mới.

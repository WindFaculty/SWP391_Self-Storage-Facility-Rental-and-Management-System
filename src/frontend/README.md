# Frontend

React SPA dùng Vite và Tailwind CSS cho năm vai trò của hệ thống.

## Cấu trúc

```text
src/
├── api/          # API clients
├── components/   # component dùng chung
├── context/      # authentication state
├── features/     # auth, facility, reservation, rental, payment, support, staff, management, admin
├── layouts/
├── routes/
└── store/
```

Khung feature trống được giữ bằng `.gitkeep`; khi phát triển, đặt page, hook và API-specific UI trong đúng feature.

## Chạy

```bash
npm install
npm run dev
npm run build
```

Frontend gọi backend qua `/api/v1`.

# Hôm Nay Đọc Gì? 📚

Manga discovery roulette xây từ giao diện case-opening của `truanayangi`, dùng dữ liệu từ Suicaodex.

## Tính năng MVP

- tải pool manga từ `https://wd.suicaodex.com`
- lọc theo thể loại, trạng thái và demographic
- chỉ lấy manga `safe` và có chapter
- mỗi lần quay dùng `/manga/random` để chọn winner trên toàn dataset đã filter
- dùng cover từ `https://i.suicaodex.com`
- tránh lặp tối đa 30 manga gần nhất bằng `localStorage`
- mở manga trực tiếp trên Suicaodex
- giữ animation/sound case-opening và hỗ trợ deploy Cloudflare Workers

## Chạy local

Yêu cầu Node.js 22.12+ và pnpm theo `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Mặc định frontend dùng:

```env
VITE_MANGA_API_URL=https://wd.suicaodex.com
VITE_MANGA_IMAGE_URL=https://i.suicaodex.com
VITE_MANGA_READER_URL=https://suicaodex.com/manga
```

Chỉ cần khai báo các biến trên nếu muốn override.

## Build và deploy Cloudflare Workers

```sh
pnpm build
pnpm deploy
```

`wrangler.jsonc` phục vụ `dist/` bằng Workers Static Assets với SPA fallback.

## CORS

`homnaydocgi.suicaodex.com` và `wd.suicaodex.com` vẫn là hai origin khác nhau. API hiện hỗ trợ CORS qua `ALLOWED_ORIGINS`; khi production nên đặt ít nhất:

```env
ALLOWED_ORIGINS=https://homnaydocgi.suicaodex.com
```

Nếu còn consumer khác, thêm từng origin cách nhau bằng dấu phẩy.

## Nguồn dữ liệu

API: https://wd.suicaodex.com/docs

Source API: https://github.com/TNTKien/wd-suicaodex-api

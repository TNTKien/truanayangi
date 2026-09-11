# Hôm Nay Đọc Gì? 📚

Manga discovery roulette xây từ giao diện case-opening của `truanayangi`, trộn dữ liệu từ Suicaodex/WeebDex và MoeTruyen.

## Tính năng

- trộn pool manga từ `https://wd.suicaodex.com` và `https://moe.suicaodex.com`
- chuẩn hóa hai API về cùng một `MangaItem`
- gộp thể loại theo tên, giữ ID riêng cho từng nguồn
- lọc theo thể loại và trạng thái trên cả hai nguồn khi API hỗ trợ
- filter demographic chỉ áp dụng cho WD vì Moe API không có trường tương ứng
- WD chỉ lấy manga `safe` và có chapter; Moe chỉ lấy manga có chapter
- winner được chọn cân bằng theo nguồn đang khả dụng; WD dùng `/manga/random`, Moe dùng `/v2/manga/random` khi không có filter và fallback về pool đã filter khi cần
- dùng cover từ từng API/CDN tương ứng
- tránh lặp tối đa 30 manga gần nhất bằng `localStorage`, phân biệt theo source + id
- link kết quả WD về Suicaodex và Moe về `https://moetruyen.net/manga/[id]`
- giữ animation/sound case-opening và hỗ trợ deploy Cloudflare Workers
- nếu một API tạm lỗi/CORS, nguồn còn lại vẫn tiếp tục hoạt động

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
VITE_MOE_API_URL=https://moe.suicaodex.com
VITE_MOE_READER_URL=https://moetruyen.net/manga
```

Chỉ cần khai báo các biến trên nếu muốn override.

## Build và deploy Cloudflare Workers

```sh
pnpm build
pnpm deploy
```

`wrangler.jsonc` phục vụ `dist/` bằng Workers Static Assets với SPA fallback.

## CORS

`homnaydocgi.suicaodex.com`, `wd.suicaodex.com` và `moe.suicaodex.com` là các origin khác nhau.

WD API hỗ trợ `ALLOWED_ORIGINS`; Moe API dùng danh sách origin chính xác từ `ALLOWED_ORIGINS`. Ở production, đảm bảo cả hai API đều cho phép:

```env
ALLOWED_ORIGINS=https://homnaydocgi.suicaodex.com
```

Nếu còn consumer khác, thêm các origin cần thiết theo format mà từng API đang hỗ trợ.

## Nguồn dữ liệu

WD API: https://wd.suicaodex.com/docs  
WD source: https://github.com/TNTKien/wd-suicaodex-api

Moe API: https://moe.suicaodex.com/docs  
Moe source: https://github.com/TNTKien/moetruyen-public-api

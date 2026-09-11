# Trưa Nay Ăn Gì 🍜

**Tiếng Việt** · [English](README.en.md)

**Website chính thức: [truanayangi.com](https://truanayangi.com/)**

Chưa biết ăn gì trưa nay? Mở hòm, quay món và để bữa trưa có chút bất ngờ.

Đây là phiên bản cộng đồng chạy trên máy của bạn, không cần đăng nhập hay backend. Bạn có thể lọc món, thêm danh sách món riêng và lưu sở thích ngay trong trình duyệt.

## Chạy trên máy

Cần **Node.js 22.12+** và phiên bản **pnpm** ghi trong [package.json](package.json).

```sh
git clone https://github.com/truanayangi-com/truanayangi.git
cd truanayangi
pnpm install --frozen-lockfile
pnpm start
```

Mở [127.0.0.1:5173](http://127.0.0.1:5173). Không cần tạo `.env` hay cấu hình dịch vụ bên ngoài. Nếu cổng đang bận, chạy `pnpm start --port 5188`.

Các lệnh phát triển:

```sh
pnpm test       # Chạy kiểm tra
pnpm build      # Tạo bản build
pnpm preview    # Xem bản build tại http://127.0.0.1:4173
```

Máy chủ chỉ lắng nghe trên `127.0.0.1`. Sau khi cài dependencies, ứng dụng tải tài nguyên từ máy; các liên kết bên ngoài chỉ mở khi bạn bấm vào.

## Dữ liệu của bạn

Sở thích, danh sách món và lượt quay tự lưu bằng cookie trong trình duyệt hiện tại. Xóa cookie sẽ đặt lại dữ liệu; dữ liệu không đồng bộ giữa các thiết bị. Lượt quay hiển thị là của riêng trình duyệt này.

Nếu cookie bị chặn hoặc danh sách món quá lớn, ứng dụng sẽ báo chưa lưu.

## GitHub Pages và website chính

GitHub Pages chỉ chuyển hướng đến https://truanayangi.com/. Đây là cách giữ chức năng đồng nhất: người truy cập luôn dùng cùng frontend production, API và cookie đăng nhập cùng origin, thay vì một ứng dụng tĩnh thứ hai dễ lệch tính năng hoặc mất đăng nhập khi tải lại. Chỉ xuất bản `pages-redirect/` lên `gh-pages`; không đưa bản build local lên đó. Các sửa đổi UI tĩnh và chuyển động vòng quay dùng chung cần được cập nhật đồng thời ở repo này và frontend production riêng tư.

## Deploy lên Cloudflare Workers

Fork này giữ thêm cấu hình deploy bản Vite SPA lên Cloudflare Workers bằng Workers Static Assets. Đăng nhập Wrangler một lần rồi chạy:

```sh
npx wrangler login
pnpm deploy
```

`pnpm deploy` sẽ build ứng dụng vào `dist/` rồi deploy theo `wrangler.jsonc`. Các route không khớp static asset sẽ fallback về `index.html`, phù hợp với SPA.

## Đóng góp

Chào đón mọi người [báo lỗi, đề xuất ý tưởng](https://github.com/truanayangi-com/truanayangi/issues/new) hoặc fork repo và [gửi PR vào `main`](https://github.com/truanayangi-com/truanayangi/compare). Bạn có thể dùng tiếng Việt hoặc tiếng Anh, mở draft PR để trao đổi, không cần được duyệt issue trước hay tham gia tổ chức.

Chỉ cần mô tả rõ thay đổi và cách đã kiểm tra. Với thay đổi code, hãy chạy test và build khi có thể; maintainer sẽ hỗ trợ và review trước khi merge. Giữ thông tin bí mật ngoài repo và ghi công nguồn sử dụng.

## Nguồn gốc

Repo được chuyển từ `nagisanzenin/truanayangi`, giữ nguyên lịch sử Git và đóng góp cộng đồng. Xem [ghi công tác giả và tài nguyên](ATTRIBUTION.md).

[GitHub Pages](https://truanayangi-com.github.io/truanayangi/) chuyển hướng đến website chính thức. Chỉ thư mục `pages-redirect/` được xuất bản lên `gh-pages`; mã ứng dụng trong repo dành cho việc chạy trên máy.

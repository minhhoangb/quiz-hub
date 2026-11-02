# Quiz Hub

Ứng dụng luyện trắc nghiệm đa môn, giao diện tiếng Việt. Chạy hoàn toàn trong trình duyệt, không cần backend.

## Chạy ứng dụng

Trong thư mục `quiz-hub`:

```sh
npm install
npm run dev
```

Mở [localhost:5173](http://localhost:5173). Tạo bản phát hành bằng `npm run build`, kiểm tra bản phát hành bằng `npm run preview`. Chạy kiểm tra logic bằng `npm test`.

## Thêm môn học

1. Tạo `src/data/questions/ten-mon.json` chứa mảng câu hỏi theo mẫu bên dưới.
2. Thêm một dòng vào mảng trong `src/data/subjects.js`:

```js
{ id: 'ten-mon', name: 'Tên môn học', icon: '📚', file: 'ten-mon' },
```

Vite tự tìm file JSON, không cần thêm import. `id` môn phải duy nhất; `file` là tên file không có `.json`.

## Thêm câu hỏi

Thêm phần tử vào mảng JSON của môn tương ứng. Mỗi câu phải có `id` số duy nhất trong môn, đúng 4 lựa chọn, và `difficulty` là `Easy`, `Medium` hoặc `Hard`.

```json
{
  "id": 9,
  "topic": "Chủ đề",
  "difficulty": "Easy",
  "question": "Câu hỏi của bạn?",
  "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
  "correctAnswer": 0,
  "explanation": "Giải thích đáp án."
}
```

`correctAnswer` bắt đầu từ **0**: A = 0, B = 1, C = 2, D = 3. Giữ nguyên ID câu hỏi đã dùng để tiến độ cũ vẫn khớp. Ứng dụng hiện chỉ có môn MDS301, với ngân hàng câu hỏi tại `src/data/questions/mds_question.json`. ID môn vẫn là `mds` để giữ tiến độ đã lưu.

## Cách học và lưu tiến độ

- Chọn số câu hoặc học tất cả. Câu chưa học được ưu tiên; nếu thiếu, bổ sung câu đã học, không trùng câu trong phiên.
- Phím **1–4** chọn đáp án; **Enter** chuyển câu sau khi trả lời. Có thể tạm dừng hoặc quay lại mà không mất phiên.
- Câu sai tạo thẻ ôn tập riêng cho mỗi môn. Nhấn thẻ hoặc **Space** để lật; **← / →** đổi thẻ. “Mình đã nhớ!” gỡ câu khỏi bộ thẻ; “Ôn lại sau” giữ câu để học tiếp.
- Chỉ có một phiên đang học tại một thời điểm. Khi thay thế phiên dở, ứng dụng yêu cầu xác nhận; câu đã khám phá và bộ thẻ vẫn được giữ.
- Tất cả dữ liệu được ghi ngay dưới một khóa `quiz_practice_v1` trong localStorage. Khóa được giữ theo schema của yêu cầu. `answeredIds` bổ sung để ưu tiên câu chưa học và `reviewFlipped` lưu mặt hiện tại của thẻ. Thống kê cộng một lần khi hoàn thành phiên.
- Khi mở lại, màn hình môn học hiển thị banner tiếp tục phiên dở. Mở bộ ôn tập để trở về đúng vị trí và mặt thẻ đã lưu.
- Dữ liệu thuộc trình duyệt và địa chỉ đang mở; xóa dữ liệu trình duyệt sẽ xóa tiến độ. Nếu trình duyệt chặn lưu trữ hoặc hết dung lượng, ứng dụng hiển thị thông báo.

## Thiết kế

Phong cách góc học tập nhẹ nhàng: nền ngà, xanh lá trầm, minh họa thẻ học và nhịp khoảng cách 8px. Font hệ thống hiển thị tiếng Việt ngay, không tải font ngoài. Animation CSS ngắn; hỗ trợ giảm chuyển động, thao tác bàn phím và bố cục di động.

Cấu hình Tailwind sử dụng [PostCSS](https://tailwindcss.com/docs/installation/using-postcss) và nạp animation từ `tailwind.config.js` qua `@config` theo [tài liệu chính thức](https://tailwindcss.com/docs/upgrade-guide#using-a-javascript-config-file).

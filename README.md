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

- Chọn **Học theo số câu** để mở bộ chọn Cơ bản, Trung bình, Nâng cao bên dưới; số câu và tiến độ cập nhật theo mức đã chọn. Khi đổi mức, số câu được giảm về giới hạn hợp lệ nếu cần. **Học tất cả** ẩn bộ chọn mức và lấy toàn bộ câu hỏi ở cả ba mức. Câu chưa học được ưu tiên; nếu thiếu, bổ sung câu đã học, không trùng câu trong phiên.
- Phím **1–4** chọn đáp án; **Enter** chuyển câu sau khi trả lời. Có thể tạm dừng hoặc quay lại mà không mất phiên.
- Câu sai tạo thẻ ôn tập riêng cho mỗi môn. Nhấn thẻ hoặc **Space** để lật; **← / →** đổi thẻ. “Mình đã nhớ!” gỡ câu khỏi bộ thẻ; “Ôn lại sau” giữ câu để học tiếp.
- Chỉ có một phiên đang học tại một thời điểm. Khi thay thế phiên dở, ứng dụng yêu cầu xác nhận; câu đã khám phá và bộ thẻ vẫn được giữ.
- Tất cả dữ liệu được ghi ngay dưới một khóa `quiz_practice_v1` trong localStorage. Khóa được giữ theo schema của yêu cầu. `answeredIds` bổ sung để ưu tiên câu chưa học và `reviewFlipped` lưu mặt hiện tại của thẻ. Thống kê cộng một lần khi hoàn thành phiên.
- Khi mở lại, màn hình môn học hiển thị banner tiếp tục phiên dở. Mở bộ ôn tập để trở về đúng vị trí và mặt thẻ đã lưu.
- Dữ liệu thuộc trình duyệt và địa chỉ đang mở; xóa dữ liệu trình duyệt sẽ xóa tiến độ. Nếu trình duyệt chặn lưu trữ hoặc hết dung lượng, ứng dụng hiển thị thông báo.

## Xóa tạm và hiện lại card

- Biểu tượng thùng rác **Xóa** ở góc phải card môn học ẩn môn khỏi danh sách. Biểu tượng **Xóa** ở góc phải thẻ trong bộ ôn tập ẩn riêng thẻ đó, không đánh dấu đã nhớ và không xóa câu hỏi khỏi ngân hàng.
- Trạng thái ẩn được lưu bằng localStorage trên trình duyệt hiện tại, không dùng database. Tải lại trang vẫn giữ trạng thái; nội dung, tiến độ và phiên đang học được giữ nguyên.
- Muốn hiện lại tất cả card đã ẩn, tăng `CARD_VISIBILITY_VERSION` trong `src/data/cardVisibility.js` (ví dụ từ `2` thành `3`) rồi build và triển khai lại. Không cần xóa dữ liệu tiến độ.

## Xem và chỉnh sửa câu hỏi

- Trên card môn, chọn **Xem câu hỏi & đáp án** để xem nội dung, 4 lựa chọn, đáp án đúng và giải thích. Có tìm kiếm và phân trang.
- **Chỉnh sửa** hoặc **Thêm câu hỏi** mở biểu mẫu sửa nội dung, chủ đề, mức độ, các lựa chọn, đáp án đúng và giải thích. Chọn **Lưu vào bản nháp**, sau đó **Cập nhật** để áp dụng. Biểu tượng **Xóa** ở góc phải card câu hỏi chỉ xóa trong bản nháp cho đến khi cập nhật.
- **Cập nhật** tải toàn bộ mảng câu hỏi theo schema gốc thành `mds_question_edited.json`, đồng thời lưu bản đã sửa trong localStorage (`quiz_edited_banks_v1`). File gốc không bị ghi đè; không có database hay tài khoản.
- Chỉ trình duyệt đã cập nhật mới có lựa chọn **JSON có sẵn / JSON đã chỉnh sửa** trong màn hình câu hỏi. Lựa chọn được lưu và áp dụng cho các phiên học mới cùng bộ ôn tập. Phiên học đang dở giữ bản câu hỏi lúc bắt đầu.
- Bản sửa thuộc trình duyệt và địa chỉ hiện tại. Trình duyệt khác không thấy bản sửa; xóa dữ liệu trình duyệt sẽ mất bản lưu, vì vậy hãy giữ file JSON đã tải.

## Thiết kế

Phong cách góc học tập nhẹ nhàng: nền ngà, xanh lá trầm, minh họa thẻ học và nhịp khoảng cách 8px. Font hệ thống hiển thị tiếng Việt ngay, không tải font ngoài. Animation CSS ngắn; hỗ trợ giảm chuyển động, thao tác bàn phím và bố cục di động.

Cấu hình Tailwind sử dụng [PostCSS](https://tailwindcss.com/docs/installation/using-postcss) và nạp animation từ `tailwind.config.js` qua `@config` theo [tài liệu chính thức](https://tailwindcss.com/docs/upgrade-guide#using-a-javascript-config-file).

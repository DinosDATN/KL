# Hướng dẫn thiết lập chức năng gửi file/ảnh trong chat

## Bước 1: Cập nhật Database

Chạy SQL script để thêm các field mới vào bảng `chat_messages`:

```sql
-- File: api/sql-scripts/001-13-add-file-fields-to-chat-messages.sql
ALTER TABLE chat_messages
ADD COLUMN file_url VARCHAR(500) NULL AFTER type,
ADD COLUMN file_name VARCHAR(255) NULL AFTER file_url,
ADD COLUMN file_size BIGINT NULL AFTER file_name;

CREATE INDEX idx_chat_messages_file_url ON chat_messages(file_url(255));
```

Hoặc chạy file SQL trực tiếp:

```bash
mysql -u your_username -p your_database < api/sql-scripts/001-13-add-file-fields-to-chat-messages.sql
```

## Bước 2: Kiểm tra thư mục upload

Đảm bảo thư mục `api/uploads/chat` tồn tại và có quyền ghi:

```bash
mkdir -p api/uploads/chat
chmod 755 api/uploads/chat
```

## Bước 3: Khởi động lại server

Sau khi cập nhật database, khởi động lại API server:

```bash
cd api
npm run dev
```

## Kiểm tra

1. Kiểm tra xem API có chạy không: `GET /api/v1/chat/rooms`
2. Thử upload file: `POST /api/v1/chat/upload` với FormData chứa field `file`

## Lỗi thường gặp

### Lỗi: "Unknown column 'file_url' in 'field list'"

- **Nguyên nhân**: Database chưa có các field mới
- **Giải pháp**: Chạy SQL script ở Bước 1

### Lỗi: "File type not allowed"

- **Nguyên nhân**: File không đúng định dạng được phép
- **Giải pháp**: Chỉ upload các file: ảnh (jpeg, jpg, png, gif, webp) hoặc file (zip, rar, pdf, doc, docx, xls, xlsx, ppt, pptx, txt)

### Lỗi: "File too large"

- **Nguyên nhân**: File vượt quá 50MB
- **Giải pháp**: Giảm kích thước file hoặc tăng limit trong `chatController.js`

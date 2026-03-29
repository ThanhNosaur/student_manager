# 🎓 Student Manager — B-Tree Index Visualization

Ứng dụng quản lý sinh viên sử dụng **B-Tree bậc 3** làm chỉ mục để tăng tốc các thao tác tìm kiếm. Hệ thống trực quan hóa cấu trúc cây B-Tree theo thời gian thực khi thực hiện các thao tác.

## ✨ Tính năng

| Thao tác | Mô tả |
|----------|-------|
| **Thêm sinh viên** | Thêm vào bảng dữ liệu và cập nhật 2 B-Tree index |
| **Xóa sinh viên** | Xóa khỏi bảng và cập nhật index kèm cân bằng cây |
| **Tìm theo Mã SV** | Dùng B-Tree index → O(log n) |
| **Tìm theo Họ tên** | Dùng B-Tree index thứ 2 → hỗ trợ tìm partial match |

## 🌳 Cấu trúc B-Tree

- **Bậc t = 2** (B-Tree bậc 3)
- Mỗi node có **tối đa 3 keys** (2t−1) và **tối đa 4 children** (2t)
- Mỗi node (trừ root) có **tối thiểu 1 key** (t−1)
- **2 cây index**: một theo Mã SV, một theo Họ tên

### Các thao tác B-Tree:
- **Insert**: Tách node khi đầy (split), đẩy median lên parent
- **Delete**: Xoay key từ sibling hoặc merge node khi thiếu
- **Search**: Duyệt từ root theo thứ tự key

## 🗂 Cấu trúc thư mục

```
student-btree-app/
├── index.html      # Giao diện chính
├── style.css       # CSS styling (dark theme)
├── btree.js        # B-Tree implementation thuần JavaScript
├── app.js          # Logic ứng dụng + SVG visualizer
└── README.md       # Tài liệu này
```

## 🚀 Cách chạy

### Cách 1: Mở trực tiếp
```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/student-btree-app.git
cd student-btree-app

# Mở file index.html bằng trình duyệt (Chrome/Firefox/Edge)
open index.html       # macOS
start index.html      # Windows
xdg-open index.html   # Linux
```

### Cách 2: Dùng Live Server (VS Code)
Cài extension **Live Server**, click chuột phải vào `index.html` → **Open with Live Server**

### Cách 3: Python HTTP Server
```bash
python -m http.server 8080
# Mở http://localhost:8080
```

## 📊 Độ phức tạp thuật toán

| Thao tác | B-Tree (có index) | Linear Scan (không index) |
|----------|-------------------|--------------------------|
| Tìm kiếm | **O(log n)** | O(n) |
| Chèn | **O(log n)** | O(1) |
| Xóa | **O(log n)** | O(n) |
| Không gian | O(n) | — |

## 🔧 Thông tin kỹ thuật

- **Ngôn ngữ**: HTML + CSS + Vanilla JavaScript (không dùng framework)
- **Visualizer**: SVG được sinh động theo thời gian thực
- **Không cần backend**: Chạy hoàn toàn trên trình duyệt
- **Responsive**: Hỗ trợ màn hình nhỏ

## 📸 Giao diện

- Dark theme với màu sắc rõ ràng phân biệt các loại thao tác
- 🟢 Xanh lá: Key vừa được thêm
- 🔵 Xanh dương: Key đang được tìm kiếm  
- 🔴 Đỏ: Key bị xóa
- Bảng sinh viên và 2 B-Tree đồng bộ thay đổi cùng lúc

## 📝 Thông tin sinh viên

Mỗi sinh viên gồm các trường:
- **Mã SV** (khóa chính, index 1)
- **Họ và Tên** (index 2)
- **Giới tính**
- **Ngày sinh**
- **Khoa / Ngành**
- **Email**

---

> Built with ❤️ — B-Tree Algorithm Visualization

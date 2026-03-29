# Student Manager — B-Tree Index Visualization

Ứng dụng quản lý sinh viên sử dụng **B-Tree bậc 3** làm chỉ mục để tăng tốc các thao tác tìm kiếm. Hệ thống trực quan hóa cấu trúc cây B-Tree theo thời gian thực khi thực hiện các thao tác.

## Tính năng

| Thao tác | Mô tả |
|----------|-------|
| **Thêm sinh viên** | Thêm vào bảng dữ liệu và cập nhật 2 B-Tree index (Theo MSSV/Theo tên) |
| **Xóa sinh viên** | Xóa khỏi bảng và cập nhật index kèm cân bằng cây |
| **Tìm theo Mã SV** | Dùng B-Tree index → O(log n) |
| **Tìm theo Họ tên** | Dùng B-Tree index thứ 2 → hỗ trợ tìm partial match |

## Cấu trúc B-Tree

- B-Tree bậc 3
- Mỗi node có 1 - 2 keys
- Mỗi node có 2 - 3 node con
- 2 cây index: một theo Mã SV, một theo Họ tên

## Các thao tác B-Tree:
- Insert: Tách node khi đầy (split), đẩy median lên parent
- Delete: Xoay key từ sibling hoặc merge node khi thiếu
- Search: Duyệt từ root theo thứ tự key

## Cấu trúc thư mục

```
student-btree-app/
├── app.js         
├── btree.js        
├── index.html     
├── README.md    
├── OIP.webp
└── style.css     
```

## Demo ứng dụng:
* Link github page: https://thanhnosaur.github.io/student_manager/
* Tài liệu liên quan đặt tại: https://github.com/ThanhNosaur/student_manager


## Độ phức tạp thuật toán

| Thao tác | B-Tree (có index) | Linear Scan (không index) |
|----------|-------------------|--------------------------|
| Tìm kiếm | **O(log n)** | O(n) |
| Chèn | **O(log n)** | O(1) |
| Xóa | **O(log n)** | O(n) |
| Không gian | O(n) | — |

## Thông tin kỹ thuật

- **Ngôn ngữ**: HTML + CSS + JavaScript
- **Visualizer**: SVG được sinh động theo thời gian thực
- **Không cần backend**: Chạy hoàn toàn trên trình duyệt
- **Responsive**: Hỗ trợ màn hình nhỏ

## Thông tin sinh viên

Mỗi sinh viên gồm các trường:
- **Mã SV** (khóa chính, index 1)
- **Họ và Tên** (index 2)
- **Giới tính**
- **Ngày sinh**
- **Khoa**
- **Email**

## Tác giả: Đăng Tuấn Thanh
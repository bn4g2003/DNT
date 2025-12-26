# BỔ SUNG DASHBOARD - SỬ DỤNG DỮ LIỆU CÓ SẴN

## Các phần cần bổ sung:

### 1. Tổng số lớp đang học - đã kết thúc
- Lọc từ `classes` collection
- Status: 'Đang học' vs 'Kết thúc'

### 2. Lớp mở trong tháng - sẽ kết thúc trong tháng  
- Filter `classes` theo `startDate` và `endDate`

### 3. Số học viên đang học - đã hoàn thành
- Filter `students` theo status 'Đang học' vs 'Đã học hết phí'

### 4. Số học viên nghỉ/bảo lưu - tái tục
- Đã có: nghỉ/bảo lưu
- Thêm: tái tục (học viên quay lại sau khi nghỉ)

### 5. Thống kê học viên theo thời gian (Line chart)
- Group students by `createdAt` month
- Show trend 6 tháng gần nhất

### 6. Xu hướng doanh thu theo thời gian
- Group contracts by month
- Line chart 6 tháng

### 7. Tỷ trọng các nguồn thu từng khóa học
- Đã có: Revenue by category (pie chart)
- Bổ sung: Group by course name

### 8. Xu hướng kênh tuyển sinh theo thời gian
- Từ `leads` collection
- Group by `source` và month

### 9. Tỷ trọng các kênh
- Pie chart từ leads source

### 10. Mục tiêu tháng (KPI)
- Sử dụng `departmentGoals` collection có sẵn
- Hiển thị % hoàn thành

## Implementation Plan:

Sẽ thêm vào Dashboard.tsx:
1. Fetch thêm data từ các collection
2. Tính toán metrics mới
3. Thêm Line charts (recharts)
4. Thêm KPI cards
5. Tất cả dùng dữ liệu THỰC từ Firebase

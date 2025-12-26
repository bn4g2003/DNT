# CẬP NHẬT STAFF FORM - HƯỚNG DẪN

## Đã tạo:
- `components/StaffFormModal.tsx` - Form mới trực quan, phù hợp với phân quyền

## Cần làm trong StaffManager.tsx:

### 1. Thêm import (ĐÃ LÀM):
```typescript
import { StaffFormModal } from '../components/StaffFormModal';
```

### 2. Thay thế phần modal cũ (từ dòng 666):

**XÓA:** Toàn bộ phần từ `{/* Create/Edit Modal */}` đến hết `</div>` của modal

**THAY BẰNG:**
```typescript
      {/* Staff Form Modal - NEW */}
      <StaffFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={async (data) => {
          if (editingStaff) {
            await updateStaff(editingStaff.id, data);
            alert('Đã cập nhật nhân viên!');
          } else {
            await createStaff(data as Omit<Staff, 'id'>);
            alert('Đã thêm nhân viên mới!');
          }
        }}
        editingStaff={editingStaff}
        centerList={centerList}
      />
```

### 3. XÓA các state không cần thiết:
- `formData` state (dòng ~75-90)
- `showPassword` state
- Các hàm `handleCreate`, `handleEdit`, `handleSubmit` cũ

### 4. GIỮ LẠI:
- `handleDelete` function
- `handleImportStaff` function
- Tất cả phần render table và tabs

## Tính năng mới:

### ✅ Trực quan hơn:
- Layout 2 cột rõ ràng
- Icon cho từng field
- Màu sắc phân biệt phòng ban

### ✅ Phù hợp phân quyền:
- Hiển thị role tự động dựa trên vị trí
- Mô tả quyền hạn của từng role
- Preview permissions trước khi tạo

### ✅ Dễ sử dụng:
- Radio buttons cho vị trí (thay vì dropdown)
- Button groups cho phòng ban
- Validation rõ ràng
- Loading state khi save

## Mapping vị trí → Role:

| Vị trí | Role | Quyền |
|--------|------|-------|
| Quản trị viên | admin | Toàn quyền |
| Quản lý | admin | Toàn quyền |
| Giáo viên Việt | gv_viet | Chỉ xem lớp mình dạy |
| Giáo viên NN | gv_nuocngoai | Chỉ xem lớp mình dạy |
| Trợ giảng | tro_giang | Chỉ xem lớp mình dạy |
| Nhân viên/CSKH/Sale | cskh | Quản lý KH, tuyển sinh |
| Kế toán | ketoan | Quản lý tài chính |
| Marketing | marketer | Quản lý marketing |

## Test:
1. Tạo nhân viên mới → Kiểm tra role tự động
2. Sửa nhân viên → Kiểm tra data load đúng
3. Đổi phòng ban → Kiểm tra vị trí update
4. Đổi vị trí → Kiểm tra role description update

# 🔧 Setup Admin Staff Document - Tự Động

## ✅ Script đã sẵn sàng!

Tôi đã tạo script tự động để tạo staff document cho admin. Không cần dùng Firebase Console nữa!

## Bạn đã có:
✅ Firebase project: `edumanager-pro-6180f`  
✅ Authentication enabled  
✅ Firestore Database enabled  
✅ `.env.local` with Firebase config

## Bạn cần làm:

### Bước 1: Lấy Admin UID

1. Vào [Firebase Console](https://console.firebase.google.com/project/edumanager-pro-6180f/authentication/users)
2. Click tab **"Users"**
3. Tìm user `admin@edumanager.com` (hoặc email admin của bạn)
4. **Copy UID** (cột "User UID")

> Ví dụ UID: `kJ8xYz2aBcD3eFgH4iJkL5mN`

### Bước 2: Chạy Script Tự Động

**Cách 1: Dùng npm script**
```bash
npm run setup:admin YOUR_UID_HERE
```

**Cách 2: Dùng node trực tiếp**
```bash
node scripts/create-admin-staff.js YOUR_UID_HERE
```

**Cách 3: Windows - Double click**
```
Double click: scripts/setup-admin.bat
→ Nhập UID khi được hỏi
```

### Ví dụ:

```bash
npm run setup:admin kJ8xYz2aBcD3eFgH4iJkL5mN
```

## Kết quả mong đợi:

```
🔥 Initializing Firebase...
Project ID: edumanager-pro-6180f

📝 Creating staff document for UID: kJ8xYz2aBcD3eFgH4iJkL5mN

✅ Success! Admin staff document created!

📊 Document Details:
Collection: staff
Document ID: kJ8xYz2aBcD3eFgH4iJkL5mN
Email: admin@edumanager.com
Role: Quản trị viên

🎉 You can now login with:
Email: admin@edumanager.com
Password: [your password]

✨ Run: npm run dev
```

## Staff Document tạo được:

```javascript
{
  uid: "YOUR_UID",
  email: "admin@edumanager.com",
  name: "Admin System",
  code: "AD001",
  role: "Quản trị viên",
  department: "Quản lý",
  position: "Quản trị viên",
  phone: "0123456789",
  status: "Active",
  permissions: {
    canManageStudents: true,
    canManageClasses: true,
    canManageStaff: true,
    canManageFinance: true,
    canViewReports: true
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Kiểm tra:

1. Vào [Firestore Console](https://console.firebase.google.com/project/edumanager-pro-6180f/firestore)
2. Kiểm tra collection `staff`
3. Xem document với ID = UID của admin

## Test Login:

```bash
npm run dev
```

Vào `http://localhost:5173/login`

Login:
- Email: `admin@edumanager.com`
- Password: `admin123` (hoặc password bạn đã tạo)

---

## 🆘 Troubleshooting

### Error: "Please provide admin UID"
→ Bạn chưa truyền UID. Chạy lại với UID:
```bash
npm run setup:admin YOUR_UID
```

### Error: ".env.local not found"
→ Tạo file `.env.local` với Firebase config (xem `.env.example`)

### Error: "Missing or insufficient permissions"
→ Chưa deploy Firestore rules. Chạy:
```bash
firebase deploy --only firestore:rules
```

### Error: "Firebase config invalid"
→ Kiểm tra `.env.local` có đầy đủ các biến không

---

## Nếu muốn tạo staff cho user khác:

Chỉ cần chạy lại script với UID khác:

```bash
npm run setup:admin ANOTHER_USER_UID
```

Hoặc edit file `scripts/create-admin-staff.js` để thay đổi thông tin staff.

---

## ✅ Done!

Sau khi staff document được tạo, bạn có thể login và bắt đầu sử dụng app! 🚀

/**
 * Seed Vietnamese Sample Data to Firebase
 * Run with: node scripts/seedVietnameseData.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('🔧 Firebase Config:', { projectId: firebaseConfig.projectId });

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper functions
const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getDateInMonth = (day) => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// ============ DỮ LIỆU MẪU TIẾNG VIỆT ============

// 1. Cài đặt trung tâm
const centerSettings = {
    name: 'Trung tâm Anh ngữ Brisky',
    code: 'BRISKY-TTD',
    address: '123 Tân Tây Đô, Đan Phượng, Hà Nội',
    phone: '024-1234-5678',
    email: 'info@brisky.edu.vn',
    website: 'https://brisky.edu.vn',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
};

// 2. Chi nhánh
const branches = [
    { name: 'Brisky Tân Tây Đô', code: 'TTD', address: '123 Tân Tây Đô, Đan Phượng', phone: '024-1234-5678', isMain: true },
    { name: 'Brisky Mỹ Đình', code: 'MD', address: '456 Mỹ Đình, Nam Từ Liêm', phone: '024-2345-6789', isMain: false },
    { name: 'Brisky Cầu Giấy', code: 'CG', address: '789 Cầu Giấy, Hà Nội', phone: '024-3456-7890', isMain: false },
];

// 3. Chương trình học
const curriculums = [
    { name: 'Starter Level 1', level: 'Mầm non', duration: 3, sessions: 36, tuition: 3500000, status: 'Active', ageGroup: '4-5 tuổi' },
    { name: 'Starter Level 2', level: 'Mầm non', duration: 3, sessions: 36, tuition: 3500000, status: 'Active', ageGroup: '5-6 tuổi' },
    { name: 'Primary Level 1', level: 'Tiểu học', duration: 3, sessions: 36, tuition: 4000000, status: 'Active', ageGroup: '6-8 tuổi' },
    { name: 'Primary Level 2', level: 'Tiểu học', duration: 3, sessions: 36, tuition: 4000000, status: 'Active', ageGroup: '8-10 tuổi' },
    { name: 'Pre-Teen', level: 'THCS', duration: 4, sessions: 48, tuition: 5000000, status: 'Active', ageGroup: '10-12 tuổi' },
    { name: 'Teen Advanced', level: 'THCS', duration: 4, sessions: 48, tuition: 6000000, status: 'Active', ageGroup: '12-15 tuổi' },
];

// 4. Phòng học
const rooms = [
    { name: 'Phòng A1', type: 'Phòng học', capacity: 15, status: 'Hoạt động', branch: 'Brisky Tân Tây Đô' },
    { name: 'Phòng A2', type: 'Phòng học', capacity: 15, status: 'Hoạt động', branch: 'Brisky Tân Tây Đô' },
    { name: 'Phòng A3', type: 'Phòng học', capacity: 12, status: 'Hoạt động', branch: 'Brisky Tân Tây Đô' },
    { name: 'Phòng B1', type: 'Phòng học', capacity: 15, status: 'Hoạt động', branch: 'Brisky Mỹ Đình' },
    { name: 'Phòng B2', type: 'Phòng học', capacity: 12, status: 'Hoạt động', branch: 'Brisky Mỹ Đình' },
    { name: 'Văn phòng', type: 'Văn phòng', capacity: 10, status: 'Hoạt động', branch: 'Brisky Tân Tây Đô' },
];

// 5. Nhân viên / Giáo viên
const staff = [
    { name: 'Nguyễn Thị Lan', code: 'GV001', position: 'GV Việt', role: 'Giáo viên', phone: '0901111111', email: 'lan@brisky.edu.vn', birthDate: '1990-03-15', status: 'Active', department: 'Đào tạo' },
    { name: 'Trần Văn Hùng', code: 'GV002', position: 'GV Việt', role: 'Giáo viên', phone: '0902222222', email: 'hung@brisky.edu.vn', birthDate: '1988-07-22', status: 'Active', department: 'Đào tạo' },
    { name: 'Phạm Thị Mai', code: 'GV003', position: 'GV Việt', role: 'Giáo viên', phone: '0903333333', email: 'mai@brisky.edu.vn', birthDate: '1992-11-08', status: 'Active', department: 'Đào tạo' },
    { name: 'John Smith', code: 'GV004', position: 'GV Ngoại', role: 'Giáo viên', phone: '0904444444', email: 'john@brisky.edu.vn', birthDate: '1985-05-20', status: 'Active', department: 'Đào tạo' },
    { name: 'Sarah Johnson', code: 'GV005', position: 'GV Ngoại', role: 'Giáo viên', phone: '0905555555', email: 'sarah@brisky.edu.vn', birthDate: '1987-09-12', status: 'Active', department: 'Đào tạo' },
    { name: 'Lê Thị Hương', code: 'TG001', position: 'Trợ giảng', role: 'Trợ giảng', phone: '0906666666', email: 'huong@brisky.edu.vn', birthDate: '1995-12-25', status: 'Active', department: 'Đào tạo' },
    { name: 'Võ Văn Minh', code: 'TG002', position: 'Trợ giảng', role: 'Trợ giảng', phone: '0907777777', email: 'minh@brisky.edu.vn', birthDate: '1996-04-18', status: 'Active', department: 'Đào tạo' },
    { name: 'Hoàng Thị Hoa', code: 'NV001', position: 'Sale', role: 'Sale', phone: '0908888888', email: 'hoa@brisky.edu.vn', birthDate: '1993-06-10', status: 'Active', department: 'Kinh doanh' },
    { name: 'Đỗ Văn Tùng', code: 'NV002', position: 'Văn phòng', role: 'Văn phòng', phone: '0909999999', email: 'tung@brisky.edu.vn', birthDate: '1991-02-28', status: 'Active', department: 'Hành chính' },
];

// 6. Lớp học
const classes = [
    { name: 'Starter 1A', level: 'Mầm non', schedule: 'T2-T4-T6 17:30-18:30', teacherName: 'Nguyễn Thị Lan', assistantName: 'Lê Thị Hương', maxStudents: 15, curriculum: 'Starter Level 1', room: 'Phòng A1', branch: 'Brisky Tân Tây Đô', status: 'Đang học', totalSessions: 36, progress: '12/36 Buổi' },
    { name: 'Starter 1B', level: 'Mầm non', schedule: 'T3-T5-T7 17:30-18:30', teacherName: 'Trần Văn Hùng', assistantName: 'Võ Văn Minh', maxStudents: 15, curriculum: 'Starter Level 1', room: 'Phòng A2', branch: 'Brisky Tân Tây Đô', status: 'Đang học', totalSessions: 36, progress: '8/36 Buổi' },
    { name: 'Starter 2A', level: 'Mầm non', schedule: 'T2-T4-T6 19:00-20:00', teacherName: 'Phạm Thị Mai', assistantName: 'Lê Thị Hương', maxStudents: 15, curriculum: 'Starter Level 2', room: 'Phòng A1', branch: 'Brisky Tân Tây Đô', status: 'Đang học', totalSessions: 36, progress: '15/36 Buổi' },
    { name: 'Primary 1A', level: 'Tiểu học', schedule: 'T3-T5-T7 19:00-20:30', teacherName: 'Nguyễn Thị Lan', assistantName: 'Võ Văn Minh', maxStudents: 12, curriculum: 'Primary Level 1', room: 'Phòng A3', branch: 'Brisky Tân Tây Đô', status: 'Đang học', totalSessions: 36, progress: '20/36 Buổi' },
    { name: 'Primary 2A', level: 'Tiểu học', schedule: 'CN 9:00-10:30', teacherName: 'Trần Văn Hùng', assistantName: 'Lê Thị Hương', maxStudents: 12, curriculum: 'Primary Level 2', room: 'Phòng A2', branch: 'Brisky Tân Tây Đô', status: 'Đang học', totalSessions: 36, progress: '18/36 Buổi' },
    { name: 'Pre-Teen A', level: 'THCS', schedule: 'T2-T4-T6 18:00-19:30', teacherName: 'John Smith', assistantName: 'Võ Văn Minh', maxStudents: 10, curriculum: 'Pre-Teen', room: 'Phòng B1', branch: 'Brisky Mỹ Đình', status: 'Đang học', totalSessions: 48, progress: '24/48 Buổi' },
    { name: 'Pre-Teen B', level: 'THCS', schedule: 'T3-T5-T7 18:00-19:30', teacherName: 'Sarah Johnson', assistantName: 'Lê Thị Hương', maxStudents: 10, curriculum: 'Pre-Teen', room: 'Phòng B2', branch: 'Brisky Mỹ Đình', status: 'Đang học', totalSessions: 48, progress: '22/48 Buổi' },
    { name: 'Teen Advanced A', level: 'THCS', schedule: 'CN 14:00-16:00', teacherName: 'John Smith', assistantName: null, maxStudents: 8, curriculum: 'Teen Advanced', room: 'Phòng B1', branch: 'Brisky Mỹ Đình', status: 'Đang học', totalSessions: 48, progress: '16/48 Buổi' },
];

// 7. Phụ huynh
const parents = [
    { name: 'Nguyễn Văn Tùng', phone: '0911000001', email: 'tung.nv@gmail.com', address: 'Số 15 ngõ 52 Tân Tây Đô, Hà Nội', relationship: 'Bố' },
    { name: 'Trần Thị Hồng', phone: '0911000002', email: 'hong.tt@gmail.com', address: 'Số 28 Mỹ Đình, Nam Từ Liêm', relationship: 'Mẹ' },
    { name: 'Lê Văn Đức', phone: '0911000003', email: 'duc.lv@gmail.com', address: 'Số 45 Cầu Giấy, Hà Nội', relationship: 'Bố' },
    { name: 'Phạm Thị Nga', phone: '0911000004', email: 'nga.pt@gmail.com', address: 'Số 67 Thanh Xuân, Hà Nội', relationship: 'Mẹ' },
    { name: 'Hoàng Văn Bình', phone: '0911000005', email: 'binh.hv@gmail.com', address: 'Số 89 Đống Đa, Hà Nội', relationship: 'Bố' },
    { name: 'Vũ Thị Lan', phone: '0911000006', email: 'lan.vt@gmail.com', address: 'Số 12 Ba Đình, Hà Nội', relationship: 'Mẹ' },
    { name: 'Đặng Văn Khoa', phone: '0911000007', email: 'khoa.dv@gmail.com', address: 'Số 34 Hoàng Mai, Hà Nội', relationship: 'Bố' },
    { name: 'Bùi Thị Mai', phone: '0911000008', email: 'mai.bt@gmail.com', address: 'Số 56 Long Biên, Hà Nội', relationship: 'Mẹ' },
    { name: 'Ngô Văn Hải', phone: '0911000009', email: 'hai.nv@gmail.com', address: 'Số 78 Tây Hồ, Hà Nội', relationship: 'Bố' },
    { name: 'Đinh Thị Thu', phone: '0911000010', email: 'thu.dt@gmail.com', address: 'Số 90 Hai Bà Trưng, Hà Nội', relationship: 'Mẹ' },
    { name: 'Cao Văn Thành', phone: '0911000011', email: 'thanh.cv@gmail.com', address: 'Số 102 Hoàn Kiếm, Hà Nội', relationship: 'Bố' },
    { name: 'Phan Thị Linh', phone: '0911000012', email: 'linh.pt@gmail.com', address: 'Số 114 Gia Lâm, Hà Nội', relationship: 'Mẹ' },
];

// 8. Học sinh - đa dạng status
const generateStudents = (parentIds, classIds, classNames) => {
    const now = new Date();
    const recentDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const oldDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    return [
        // Đang học + Nợ phí
        { fullName: 'Nguyễn Minh An', code: 'HS001', phone: '0920000001', status: 'Nợ phí', className: classNames[0], classId: classIds[0], parentId: parentIds[0], dob: '2019-03-15', gender: 'Nam', registeredSessions: 36, attendedSessions: 15, remainingSessions: -3, createdAt: oldDate },
        { fullName: 'Trần Bảo Ngọc', code: 'HS002', phone: '0920000002', status: 'Nợ phí', className: classNames[0], classId: classIds[0], parentId: parentIds[1], dob: '2019-07-22', gender: 'Nữ', registeredSessions: 36, attendedSessions: 18, remainingSessions: -2, createdAt: oldDate },
        { fullName: 'Lê Hoàng Nam', code: 'HS003', phone: '0920000003', status: 'Nợ phí', className: classNames[1], classId: classIds[1], parentId: parentIds[2], dob: '2019-11-08', gender: 'Nam', registeredSessions: 36, attendedSessions: 12, remainingSessions: -4, createdAt: oldDate },

        // Học thử
        { fullName: 'Cao Minh Tuấn', code: 'HS004', phone: '0920000004', status: 'Học thử', className: classNames[0], classId: classIds[0], parentId: parentIds[3], dob: '2019-05-10', gender: 'Nam', registeredSessions: 2, attendedSessions: 1, remainingSessions: 1, createdAt: recentDate },
        { fullName: 'Phan Thanh Thảo', code: 'HS005', phone: '0920000005', status: 'Học thử', className: classNames[1], classId: classIds[1], parentId: parentIds[4], dob: '2019-09-22', gender: 'Nữ', registeredSessions: 2, attendedSessions: 0, remainingSessions: 2, createdAt: recentDate },
        { fullName: 'Đỗ Quang Hải', code: 'HS006', phone: '0920000006', status: 'Học thử', className: classNames[2], classId: classIds[2], parentId: parentIds[5], dob: '2018-12-08', gender: 'Nam', registeredSessions: 2, attendedSessions: 2, remainingSessions: 0, createdAt: recentDate },

        // Bảo lưu
        { fullName: 'Mai Đình Khôi', code: 'HS007', phone: '0920000007', status: 'Bảo lưu', className: classNames[0], classId: classIds[0], parentId: parentIds[6], dob: '2019-02-20', gender: 'Nam', registeredSessions: 36, attendedSessions: 10, remainingSessions: 26, reserveDate: getDateInMonth(1), reserveNote: 'Về quê 2 tháng', reserveSessions: 8, createdAt: oldDate },
        { fullName: 'Dương Hải Yến', code: 'HS008', phone: '0920000008', status: 'Bảo lưu', className: classNames[1], classId: classIds[1], parentId: parentIds[7], dob: '2019-06-14', gender: 'Nữ', registeredSessions: 36, attendedSessions: 15, remainingSessions: 21, reserveDate: getDateInMonth(5), reserveNote: 'Ốm nặng', reserveSessions: 6, createdAt: oldDate },

        // Nghỉ học
        { fullName: 'Trịnh Tuấn Kiệt', code: 'HS009', phone: '0920000009', status: 'Nghỉ học', className: classNames[0], classId: classIds[0], parentId: parentIds[8], dob: '2019-09-03', gender: 'Nam', registeredSessions: 36, attendedSessions: 8, remainingSessions: 0, createdAt: oldDate },
        { fullName: 'Thái Bích Ngọc', code: 'HS010', phone: '0920000010', status: 'Nghỉ học', className: classNames[1], classId: classIds[1], parentId: parentIds[9], dob: '2019-12-17', gender: 'Nữ', registeredSessions: 36, attendedSessions: 5, remainingSessions: 0, badDebt: true, badDebtSessions: 5, badDebtAmount: 750000, createdAt: oldDate },

        // Đang học bình thường
        { fullName: 'Lương Thu Trang', code: 'HS011', phone: '0920000011', status: 'Đang học', className: classNames[0], classId: classIds[0], parentId: parentIds[10], dob: '2019-08-29', gender: 'Nữ', registeredSessions: 36, attendedSessions: 12, remainingSessions: 24, createdAt: oldDate },
        { fullName: 'Châu Minh Hoàng', code: 'HS012', phone: '0920000012', status: 'Đang học', className: classNames[0], classId: classIds[0], parentId: parentIds[11], dob: '2019-12-13', gender: 'Nam', registeredSessions: 36, attendedSessions: 12, remainingSessions: 24, createdAt: oldDate },
        { fullName: 'Thi Bảo Trân', code: 'HS013', phone: '0920000013', status: 'Đang học', className: classNames[1], classId: classIds[1], parentId: parentIds[0], dob: '2019-03-26', gender: 'Nữ', registeredSessions: 36, attendedSessions: 8, remainingSessions: 28, createdAt: oldDate },
        { fullName: 'Cung Đức Duy', code: 'HS014', phone: '0920000014', status: 'Đang học', className: classNames[1], classId: classIds[1], parentId: parentIds[1], dob: '2019-07-10', gender: 'Nam', registeredSessions: 36, attendedSessions: 8, remainingSessions: 28, createdAt: oldDate },
        { fullName: 'Đàm Thúy An', code: 'HS015', phone: '0920000015', status: 'Đang học', className: classNames[2], classId: classIds[2], parentId: parentIds[2], dob: '2018-11-23', gender: 'Nữ', registeredSessions: 36, attendedSessions: 15, remainingSessions: 21, createdAt: oldDate },
        { fullName: 'Kha Minh Nhật', code: 'HS016', phone: '0920000016', status: 'Đang học', className: classNames[2], classId: classIds[2], parentId: parentIds[3], dob: '2018-04-07', gender: 'Nam', registeredSessions: 36, attendedSessions: 15, remainingSessions: 21, createdAt: oldDate },
        { fullName: 'Nghiêm Hải Đăng', code: 'HS017', phone: '0920000017', status: 'Đang học', className: classNames[3], classId: classIds[3], parentId: parentIds[4], dob: '2017-08-20', gender: 'Nam', registeredSessions: 36, attendedSessions: 20, remainingSessions: 16, createdAt: oldDate },
        { fullName: 'Biện Ngọc Huyền', code: 'HS018', phone: '0920000018', status: 'Đang học', className: classNames[3], classId: classIds[3], parentId: parentIds[5], dob: '2017-01-03', gender: 'Nữ', registeredSessions: 36, attendedSessions: 20, remainingSessions: 16, createdAt: oldDate },
        { fullName: 'Sử Quang Vinh', code: 'HS019', phone: '0920000019', status: 'Đang học', className: classNames[4], classId: classIds[4], parentId: parentIds[6], dob: '2016-05-17', gender: 'Nam', registeredSessions: 36, attendedSessions: 18, remainingSessions: 18, createdAt: oldDate },
        { fullName: 'Âu Thị Hạnh', code: 'HS020', phone: '0920000020', status: 'Đang học', className: classNames[4], classId: classIds[4], parentId: parentIds[7], dob: '2016-09-30', gender: 'Nữ', registeredSessions: 36, attendedSessions: 18, remainingSessions: 18, createdAt: oldDate },
        { fullName: 'Khổng Minh Tuấn', code: 'HS021', phone: '0920000021', status: 'Đang học', className: classNames[5], classId: classIds[5], parentId: parentIds[8], dob: '2014-02-13', gender: 'Nam', registeredSessions: 48, attendedSessions: 24, remainingSessions: 24, createdAt: oldDate },
        { fullName: 'Hà Khánh Ngân', code: 'HS022', phone: '0920000022', status: 'Đang học', className: classNames[5], classId: classIds[5], parentId: parentIds[9], dob: '2014-06-26', gender: 'Nữ', registeredSessions: 48, attendedSessions: 24, remainingSessions: 24, createdAt: oldDate },
        { fullName: 'Mã Đức Anh', code: 'HS023', phone: '0920000023', status: 'Đang học', className: classNames[6], classId: classIds[6], parentId: parentIds[10], dob: '2013-10-09', gender: 'Nam', registeredSessions: 48, attendedSessions: 22, remainingSessions: 26, createdAt: oldDate },
        { fullName: 'Bành Thị Loan', code: 'HS024', phone: '0920000024', status: 'Đang học', className: classNames[6], classId: classIds[6], parentId: parentIds[11], dob: '2013-03-23', gender: 'Nữ', registeredSessions: 48, attendedSessions: 22, remainingSessions: 26, createdAt: oldDate },
        { fullName: 'Ninh Văn Phong', code: 'HS025', phone: '0920000025', status: 'Đang học', className: classNames[7], classId: classIds[7], parentId: parentIds[0], dob: '2012-07-06', gender: 'Nam', registeredSessions: 48, attendedSessions: 16, remainingSessions: 32, createdAt: oldDate },
        { fullName: 'Cầm Thị Hà', code: 'HS026', phone: '0920000026', status: 'Đang học', className: classNames[7], classId: classIds[7], parentId: parentIds[1], dob: '2012-11-19', gender: 'Nữ', registeredSessions: 48, attendedSessions: 16, remainingSessions: 32, createdAt: oldDate },

        // Nợ hợp đồng (trả góp)
        { fullName: 'Triệu Minh Khôi', code: 'HS027', phone: '0920000027', status: 'Nợ hợp đồng', className: classNames[5], classId: classIds[5], parentId: parentIds[2], dob: '2014-04-02', gender: 'Nam', registeredSessions: 48, attendedSessions: 24, remainingSessions: 24, contractDebt: 2500000, nextPaymentDate: getDateInMonth(15), createdAt: oldDate },
        { fullName: 'Ông Thanh Thủy', code: 'HS028', phone: '0920000028', status: 'Nợ hợp đồng', className: classNames[6], classId: classIds[6], parentId: parentIds[3], dob: '2013-08-15', gender: 'Nữ', registeredSessions: 48, attendedSessions: 22, remainingSessions: 26, contractDebt: 1500000, nextPaymentDate: getDateInMonth(20), createdAt: oldDate },

        // Đã học hết phí
        { fullName: 'Tống Gia Bảo', code: 'HS029', phone: '0920000029', status: 'Đã học hết phí', className: classNames[3], classId: classIds[3], parentId: parentIds[4], dob: '2016-12-28', gender: 'Nam', registeredSessions: 36, attendedSessions: 36, remainingSessions: 0, createdAt: oldDate },
        { fullName: 'Lục Khánh Chi', code: 'HS030', phone: '0920000030', status: 'Đã học hết phí', className: classNames[4], classId: classIds[4], parentId: parentIds[5], dob: '2015-05-11', gender: 'Nữ', registeredSessions: 36, attendedSessions: 36, remainingSessions: 0, createdAt: oldDate },
    ];
};

// 9. Sản phẩm / Học liệu
const products = [
    { name: 'Sách Starter Level 1', category: 'Sách', price: 250000, stock: 15, status: 'Kích hoạt' },
    { name: 'Sách Starter Level 2', category: 'Sách', price: 250000, stock: 12, status: 'Kích hoạt' },
    { name: 'Sách Primary Level 1', category: 'Sách', price: 280000, stock: 18, status: 'Kích hoạt' },
    { name: 'Sách Primary Level 2', category: 'Sách', price: 280000, stock: 20, status: 'Kích hoạt' },
    { name: 'Sách Pre-Teen', category: 'Sách', price: 320000, stock: 10, status: 'Kích hoạt' },
    { name: 'Sách Teen Advanced', category: 'Sách', price: 350000, stock: 8, status: 'Kích hoạt' },
    { name: 'Áo đồng phục S', category: 'Đồng phục', price: 150000, stock: 25, status: 'Kích hoạt' },
    { name: 'Áo đồng phục M', category: 'Đồng phục', price: 150000, stock: 30, status: 'Kích hoạt' },
    { name: 'Áo đồng phục L', category: 'Đồng phục', price: 160000, stock: 20, status: 'Kích hoạt' },
    { name: 'Balo Brisky', category: 'Học liệu', price: 200000, stock: 15, status: 'Kích hoạt' },
    { name: 'Bộ Flashcard', category: 'Học liệu', price: 120000, stock: 40, status: 'Kích hoạt' },
    { name: 'Vở ghi chép Brisky', category: 'Học liệu', price: 25000, stock: 100, status: 'Kích hoạt' },
];

// 10. Ngày nghỉ
const holidays = [
    { name: 'Tết Dương lịch 2025', startDate: '2025-01-01', endDate: '2025-01-01', status: 'Đã áp dụng', applyType: 'all_classes' },
    { name: 'Nghỉ Tết Nguyên đán', startDate: '2025-01-28', endDate: '2025-02-03', status: 'Chưa áp dụng', applyType: 'all_classes' },
    { name: 'Giỗ Tổ Hùng Vương', startDate: '2025-04-07', endDate: '2025-04-07', status: 'Chưa áp dụng', applyType: 'all_classes' },
    { name: 'Ngày Giải phóng miền Nam', startDate: '2025-04-30', endDate: '2025-04-30', status: 'Chưa áp dụng', applyType: 'all_classes' },
    { name: 'Quốc tế Lao động', startDate: '2025-05-01', endDate: '2025-05-01', status: 'Chưa áp dụng', applyType: 'all_classes' },
    { name: 'Quốc khánh', startDate: '2025-09-02', endDate: '2025-09-02', status: 'Chưa áp dụng', applyType: 'all_classes' },
];

// 11. Khách hàng tiềm năng (Leads)
const leads = [
    { name: 'Nguyễn Văn An', phone: '0931000001', email: 'an@gmail.com', source: 'Facebook', status: 'Mới', notes: 'Quan tâm lớp Starter cho con 5 tuổi', assignee: 'Hoàng Thị Hoa' },
    { name: 'Trần Thị Bình', phone: '0931000002', email: 'binh@gmail.com', source: 'Zalo', status: 'Đã liên hệ', notes: 'Hẹn gặp tuần sau, con học lớp 2', assignee: 'Hoàng Thị Hoa' },
    { name: 'Lê Văn Cường', phone: '0931000003', email: 'cuong@gmail.com', source: 'Website', status: 'Quan tâm', notes: 'Muốn đăng ký học thử lớp Primary', assignee: 'Hoàng Thị Hoa' },
    { name: 'Phạm Thị Dung', phone: '0931000004', email: 'dung@gmail.com', source: 'Giới thiệu', status: 'Hẹn gặp', notes: 'Bạn của phụ huynh lớp Starter 1A', assignee: 'Hoàng Thị Hoa' },
    { name: 'Hoàng Văn Em', phone: '0931000005', email: 'em@gmail.com', source: 'Facebook Ads', status: 'Học thử', notes: 'Đang học thử lớp Pre-Teen A', assignee: 'Hoàng Thị Hoa' },
    { name: 'Vũ Thị Phương', phone: '0931000006', email: 'phuong@gmail.com', source: 'TikTok', status: 'Đăng ký', notes: 'Đã đăng ký chính thức lớp Starter 1B', assignee: 'Hoàng Thị Hoa' },
    { name: 'Đặng Văn Giang', phone: '0931000007', email: 'giang@gmail.com', source: 'Google Ads', status: 'Từ chối', notes: 'Không phù hợp lịch học, xa nhà', assignee: 'Hoàng Thị Hoa' },
    { name: 'Bùi Thị Hằng', phone: '0931000008', email: 'hang@gmail.com', source: 'Zalo', status: 'Mới', notes: 'Cần tư vấn thêm về chương trình học', assignee: 'Hoàng Thị Hoa' },
];

// 12. Chiến dịch marketing
const campaigns = [
    { name: 'Ưu đãi Giáng sinh 2024', status: 'Đang mở', startDate: '2024-12-01', endDate: '2024-12-31', budget: 5000000, registered: 15, target: 30, discount: 20 },
    { name: 'Học thử miễn phí Tháng 1/2025', status: 'Đang mở', startDate: '2025-01-01', endDate: '2025-01-31', budget: 3000000, registered: 8, target: 25, discount: 0 },
    { name: 'Back to School 2024', status: 'Kết thúc', startDate: '2024-08-01', endDate: '2024-09-30', budget: 8000000, registered: 45, target: 40, discount: 15 },
    { name: 'Khuyến mãi Tết 2025', status: 'Chưa bắt đầu', startDate: '2025-01-15', endDate: '2025-02-15', budget: 10000000, registered: 0, target: 50, discount: 25 },
];

// ============ MAIN SEED FUNCTION ============

const seedAllData = async () => {
    console.log('🚀 Bắt đầu tạo dữ liệu mẫu tiếng Việt...\n');
    const results = {};

    try {
        // 1. Cài đặt trung tâm
        console.log('1. Tạo cài đặt trung tâm...');
        await setDoc(doc(db, 'settings', 'center'), { ...centerSettings, updatedAt: new Date().toISOString() });
        results['centerSettings'] = 1;

        // 2. Chi nhánh
        console.log('2. Tạo chi nhánh...');
        const branchIds = [];
        for (const branch of branches) {
            const ref = await addDoc(collection(db, 'branches'), { ...branch, createdAt: new Date().toISOString() });
            branchIds.push(ref.id);
        }
        results['branches'] = branches.length;

        // 3. Chương trình học
        console.log('3. Tạo chương trình học...');
        const curriculumIds = [];
        for (const curr of curriculums) {
            const ref = await addDoc(collection(db, 'curriculums'), { ...curr, createdAt: new Date().toISOString() });
            curriculumIds.push(ref.id);
        }
        results['curriculums'] = curriculums.length;

        // 4. Phòng học
        console.log('4. Tạo phòng học...');
        for (const room of rooms) {
            await addDoc(collection(db, 'rooms'), { ...room, createdAt: new Date().toISOString() });
        }
        results['rooms'] = rooms.length;

        // 5. Nhân viên
        console.log('5. Tạo nhân viên...');
        const staffIds = [];
        const staffNames = [];
        for (const s of staff) {
            const ref = await addDoc(collection(db, 'staff'), { ...s, createdAt: new Date().toISOString() });
            staffIds.push(ref.id);
            staffNames.push(s.name);
        }
        results['staff'] = staff.length;

        // 6. Lớp học
        console.log('6. Tạo lớp học...');
        const classIds = [];
        const classNames = [];
        const staffMap = new Map(staff.map((s, i) => [s.name, staffIds[i]]));
        const curriculumMap = new Map(curriculums.map((c, i) => [c.name, curriculumIds[i]]));

        for (const cls of classes) {
            const teacherId = staffMap.get(cls.teacherName) || '';
            const assistantId = cls.assistantName ? staffMap.get(cls.assistantName) || '' : null;
            const curriculumId = curriculumMap.get(cls.curriculum) || '';

            const ref = await addDoc(collection(db, 'classes'), {
                ...cls,
                teacherId,
                assistantId,
                curriculumId,
                currentStudents: 0,
                startDate: '2024-09-01',
                endDate: '2025-06-30',
                createdAt: new Date().toISOString()
            });
            classIds.push(ref.id);
            classNames.push(cls.name);
        }
        results['classes'] = classes.length;

        // 7. Phụ huynh
        console.log('7. Tạo phụ huynh...');
        const parentIds = [];
        for (const parent of parents) {
            const ref = await addDoc(collection(db, 'parents'), { ...parent, createdAt: new Date().toISOString() });
            parentIds.push(ref.id);
        }
        results['parents'] = parents.length;

        // 8. Học sinh
        console.log('8. Tạo học sinh...');
        const studentIds = [];
        const studentNames = [];
        const studentsData = generateStudents(parentIds, classIds, classNames);
        const classStudentCount = new Map();

        for (const student of studentsData) {
            const parentIndex = parentIds.indexOf(student.parentId);
            const parentData = parents[parentIndex] || parents[0];

            const ref = await addDoc(collection(db, 'students'), {
                ...student,
                parentName: parentData.name,
                parentPhone: parentData.phone,
                branch: 'Brisky Tân Tây Đô',
            });
            studentIds.push(ref.id);
            studentNames.push(student.fullName);

            // Track students per class
            const count = classStudentCount.get(student.classId) || 0;
            classStudentCount.set(student.classId, count + 1);
        }

        // Update class.currentStudents
        console.log('   Cập nhật sĩ số lớp...');
        for (const [classId, count] of classStudentCount) {
            await updateDoc(doc(db, 'classes', classId), { currentStudents: count, studentsCount: count });
        }
        results['students'] = studentsData.length;

        // 9. Sản phẩm
        console.log('9. Tạo sản phẩm...');
        for (const product of products) {
            await addDoc(collection(db, 'products'), { ...product, createdAt: new Date().toISOString() });
        }
        results['products'] = products.length;

        // 10. Ngày nghỉ
        console.log('10. Tạo ngày nghỉ...');
        for (const holiday of holidays) {
            await addDoc(collection(db, 'holidays'), { ...holiday, createdAt: new Date().toISOString() });
        }
        results['holidays'] = holidays.length;

        // 11. Leads
        console.log('11. Tạo khách hàng tiềm năng...');
        for (const lead of leads) {
            await addDoc(collection(db, 'leads'), { ...lead, createdAt: new Date().toISOString() });
        }
        results['leads'] = leads.length;

        // 12. Campaigns
        console.log('12. Tạo chiến dịch...');
        for (const campaign of campaigns) {
            await addDoc(collection(db, 'campaigns'), { ...campaign, createdAt: new Date().toISOString() });
        }
        results['campaigns'] = campaigns.length;

        // Summary
        console.log('\n✅ Hoàn thành tạo dữ liệu mẫu!\n');
        console.log('📊 Thống kê:');
        console.log('─'.repeat(40));
        Object.entries(results).forEach(([key, count]) => {
            console.log(`   ${key}: ${count} bản ghi`);
        });
        console.log('─'.repeat(40));
        console.log(`   Tổng cộng: ${Object.values(results).reduce((a, b) => a + b, 0)} bản ghi`);

        return results;

    } catch (error) {
        console.error('❌ Lỗi khi tạo dữ liệu:', error);
        throw error;
    }
};

// Run the seed
seedAllData()
    .then(() => {
        console.log('\n🎉 Script hoàn thành! Dữ liệu đã được đẩy lên Firebase.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script thất bại:', error);
        process.exit(1);
    });

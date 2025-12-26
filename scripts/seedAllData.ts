/**
 * Comprehensive Seed Data Script
 * Tạo dữ liệu test đầy đủ với RELATIONAL INTEGRITY
 * 
 * Relationships:
 * - Student → Parent (parentId)
 * - Student → Class (classId)
 * - Class → Staff/Teacher (teacherId, assistantId)
 * - Class → Curriculum (curriculumId)
 * - Contract → Student + Class
 * - Attendance → Student + Class
 * - WorkSession → Staff + Class
 * - Tutoring → Student + Class
 * - Feedback → Student + Parent
 * - Invoice → Student + Products
 * - Lead → Campaign
 * - FinancialTransaction → Student/Contract/Invoice
 */

import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

// Helper functions
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getDateInMonth = (day: number) => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const randomPhone = () => `09${Math.floor(10000000 + Math.random() * 90000000)}`;

// ============ DATA DEFINITIONS ============

// 1. Center Settings
const centerSettings = {
  name: 'Brisky English Center',
  code: 'BRISKY-TTD',
  address: '123 Tân Tây Đô, Đan Phượng, Hà Nội',
  phone: '024-1234-5678',
  email: 'info@brisky.edu.vn',
  website: 'https://brisky.edu.vn',
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh',
  logo: '/logo.jpg',
};

// 2. Branches
const branches = [
  { name: 'Brisky Tân Tây Đô', code: 'TTD', address: '123 Tân Tây Đô', phone: '024-1234-5678', isMain: true },
  { name: 'Brisky Mỹ Đình', code: 'MD', address: '456 Mỹ Đình', phone: '024-2345-6789', isMain: false },
];

// 3. Curriculum
const curriculums = [
  { name: 'Academy Starter 1', level: 'Beginner', duration: 3, sessions: 36, tuition: 3500000, status: 'Active' },
  { name: 'Academy Starter 2', level: 'Beginner', duration: 3, sessions: 36, tuition: 3500000, status: 'Active' },
  { name: 'Academy Elementary 1', level: 'Elementary', duration: 3, sessions: 36, tuition: 4000000, status: 'Active' },
  { name: 'Academy Elementary 2', level: 'Elementary', duration: 3, sessions: 36, tuition: 4000000, status: 'Active' },
  { name: 'Academy Intermediate', level: 'Intermediate', duration: 4, sessions: 48, tuition: 5000000, status: 'Active' },
  { name: 'Academy Advanced', level: 'Advanced', duration: 4, sessions: 48, tuition: 6000000, status: 'Active' },
];

// 4. Salary Config
const salaryRules = [
  { position: 'GV Việt', workMethod: 'Cố định', baseSalary: 150000, bonusPerStudent: 10000, status: 'Active' },
  { position: 'GV Ngoại', workMethod: 'Cố định', baseSalary: 350000, bonusPerStudent: 15000, status: 'Active' },
  { position: 'Trợ giảng', workMethod: 'Theo sĩ số', baseSalary: 80000, bonusPerStudent: 5000, status: 'Active' },
];

// 5. Staff/Teachers
const staff = [
  { name: 'Nguyễn Thị Lan', position: 'GV Việt', phone: '0901111111', email: 'lan@brisky.edu.vn', birthDate: '1990-03-15', status: 'Active' },
  { name: 'Trần Văn Hùng', position: 'GV Việt', phone: '0902222222', email: 'hung@brisky.edu.vn', birthDate: '1988-07-22', status: 'Active' },
  { name: 'Phạm Thị Mai', position: 'GV Việt', phone: '0903333333', email: 'mai@brisky.edu.vn', birthDate: '1992-11-08', status: 'Active' },
  { name: 'John Smith', position: 'GV Ngoại', phone: '0904444444', email: 'john@brisky.edu.vn', birthDate: '1985-05-20', status: 'Active' },
  { name: 'Sarah Johnson', position: 'GV Ngoại', phone: '0905555555', email: 'sarah@brisky.edu.vn', birthDate: '1987-09-12', status: 'Active' },
  { name: 'Lê Thị Hương', position: 'Trợ giảng', phone: '0906666666', email: 'huong@brisky.edu.vn', birthDate: '1995-12-25', status: 'Active' },
  { name: 'Võ Văn Minh', position: 'Trợ giảng', phone: '0907777777', email: 'minh@brisky.edu.vn', birthDate: '1996-04-18', status: 'Active' },
];

// 6. Classes
const classes = [
  { name: 'Starter 1A', level: 'Beginner', schedule: 'T2-T4-T6 17:30', teacherName: 'Nguyễn Thị Lan', assistantName: 'Lê Thị Hương', maxStudents: 15, curriculum: 'Academy Starter 1' },
  { name: 'Starter 1B', level: 'Beginner', schedule: 'T3-T5-T7 17:30', teacherName: 'Trần Văn Hùng', assistantName: 'Võ Văn Minh', maxStudents: 15, curriculum: 'Academy Starter 1' },
  { name: 'Starter 2A', level: 'Beginner', schedule: 'T2-T4-T6 19:00', teacherName: 'Phạm Thị Mai', assistantName: 'Lê Thị Hương', maxStudents: 15, curriculum: 'Academy Starter 2' },
  { name: 'Elementary 1A', level: 'Elementary', schedule: 'T3-T5-T7 19:00', teacherName: 'Nguyễn Thị Lan', assistantName: 'Võ Văn Minh', maxStudents: 12, curriculum: 'Academy Elementary 1' },
  { name: 'Elementary 2A', level: 'Elementary', schedule: 'CN 9:00', teacherName: 'Trần Văn Hùng', assistantName: 'Lê Thị Hương', maxStudents: 12, curriculum: 'Academy Elementary 2' },
  { name: 'Intermediate A', level: 'Intermediate', schedule: 'T2-T4-T6 18:00', teacherName: 'John Smith', assistantName: 'Võ Văn Minh', maxStudents: 10, curriculum: 'Academy Intermediate' },
  { name: 'Intermediate B', level: 'Intermediate', schedule: 'T3-T5-T7 18:00', teacherName: 'Sarah Johnson', assistantName: 'Lê Thị Hương', maxStudents: 10, curriculum: 'Academy Intermediate' },
  { name: 'Advanced A', level: 'Advanced', schedule: 'CN 14:00', teacherName: 'John Smith', assistantName: null, maxStudents: 8, curriculum: 'Academy Advanced' },
];

// 7. Parents
const parents = [
  { name: 'Nguyễn Văn Tùng', phone: '0911000001', email: 'tung.nv@gmail.com', address: 'Tân Tây Đô, Hà Nội' },
  { name: 'Trần Thị Hồng', phone: '0911000002', email: 'hong.tt@gmail.com', address: 'Mỹ Đình, Hà Nội' },
  { name: 'Lê Văn Đức', phone: '0911000003', email: 'duc.lv@gmail.com', address: 'Cầu Giấy, Hà Nội' },
  { name: 'Phạm Thị Nga', phone: '0911000004', email: 'nga.pt@gmail.com', address: 'Thanh Xuân, Hà Nội' },
  { name: 'Hoàng Văn Bình', phone: '0911000005', email: 'binh.hv@gmail.com', address: 'Đống Đa, Hà Nội' },
  { name: 'Vũ Thị Lan', phone: '0911000006', email: 'lan.vt@gmail.com', address: 'Ba Đình, Hà Nội' },
  { name: 'Đặng Văn Khoa', phone: '0911000007', email: 'khoa.dv@gmail.com', address: 'Hoàng Mai, Hà Nội' },
  { name: 'Bùi Thị Mai', phone: '0911000008', email: 'mai.bt@gmail.com', address: 'Long Biên, Hà Nội' },
  { name: 'Ngô Văn Hải', phone: '0911000009', email: 'hai.nv@gmail.com', address: 'Tây Hồ, Hà Nội' },
  { name: 'Đinh Thị Thu', phone: '0911000010', email: 'thu.dt@gmail.com', address: 'Hai Bà Trưng, Hà Nội' },
];

// 8. Students - với đầy đủ status
const generateStudents = (parentIds: string[], classIds: string[], classNames: string[]) => {
  const now = new Date();
  const recentDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const oldDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  
  // Status enum values: 'Đang học' | 'Bảo lưu' | 'Đã nghỉ' | 'Học thử'
  return [
    // Đang học + Nợ phí - 12 học viên (hasDebt: true)
    { name: 'Nguyễn Minh An', phone: '0920000001', status: 'Đang học', hasDebt: true, className: classNames[0], classId: classIds[0], parentId: parentIds[0], birthDate: '2015-03-15', createdAt: oldDate },
    { name: 'Trần Bảo Ngọc', phone: '0920000002', status: 'Đang học', hasDebt: true, className: classNames[0], classId: classIds[0], parentId: parentIds[1], birthDate: '2014-07-22', createdAt: oldDate },
    { name: 'Lê Hoàng Nam', phone: '0920000003', status: 'Đang học', hasDebt: true, className: classNames[1], classId: classIds[1], parentId: parentIds[2], birthDate: '2015-11-08', createdAt: oldDate },
    { name: 'Phạm Thu Hà', phone: '0920000004', status: 'Đang học', hasDebt: true, className: classNames[1], classId: classIds[1], parentId: parentIds[3], birthDate: '2014-05-20', createdAt: oldDate },
    { name: 'Hoàng Gia Bảo', phone: '0920000005', status: 'Đang học', hasDebt: true, className: classNames[2], classId: classIds[2], parentId: parentIds[4], birthDate: '2013-09-12', createdAt: oldDate },
    { name: 'Vũ Khánh Linh', phone: '0920000006', status: 'Đang học', hasDebt: true, className: classNames[2], classId: classIds[2], parentId: parentIds[5], birthDate: '2014-12-25', createdAt: oldDate },
    { name: 'Đặng Quốc Huy', phone: '0920000007', status: 'Đang học', hasDebt: true, className: classNames[3], classId: classIds[3], parentId: parentIds[6], birthDate: '2012-04-18', createdAt: oldDate },
    { name: 'Bùi Thanh Mai', phone: '0920000008', status: 'Đang học', hasDebt: true, className: classNames[3], classId: classIds[3], parentId: parentIds[7], birthDate: '2013-08-30', createdAt: oldDate },
    { name: 'Ngô Đức Minh', phone: '0920000009', status: 'Đang học', hasDebt: true, className: classNames[4], classId: classIds[4], parentId: parentIds[8], birthDate: '2011-02-14', createdAt: oldDate },
    { name: 'Đinh Phương Anh', phone: '0920000010', status: 'Đang học', hasDebt: true, className: classNames[4], classId: classIds[4], parentId: parentIds[9], birthDate: '2012-06-28', createdAt: oldDate },
    { name: 'Trương Minh Khang', phone: '0920000011', status: 'Đang học', hasDebt: true, className: classNames[5], classId: classIds[5], parentId: parentIds[0], birthDate: '2010-10-05', createdAt: oldDate },
    { name: 'Lý Thị Hương', phone: '0920000012', status: 'Đang học', hasDebt: true, className: classNames[5], classId: classIds[5], parentId: parentIds[1], birthDate: '2011-01-17', createdAt: oldDate },
    
    // Học thử - 8 học viên
    { name: 'Cao Minh Tuấn', phone: '0920000013', status: 'Học thử', hasDebt: false, className: classNames[0], classId: classIds[0], parentId: parentIds[2], birthDate: '2015-05-10', createdAt: recentDate },
    { name: 'Phan Thanh Thảo', phone: '0920000014', status: 'Học thử', hasDebt: false, className: classNames[1], classId: classIds[1], parentId: parentIds[3], birthDate: '2014-09-22', createdAt: recentDate },
    { name: 'Đỗ Quang Hải', phone: '0920000015', status: 'Học thử', hasDebt: false, className: classNames[2], classId: classIds[2], parentId: parentIds[4], birthDate: '2013-12-08', createdAt: recentDate },
    { name: 'Hồ Ngọc Ánh', phone: '0920000016', status: 'Học thử', hasDebt: false, className: classNames[3], classId: classIds[3], parentId: parentIds[5], birthDate: '2012-03-15', createdAt: recentDate },
    { name: 'Tô Văn Thành', phone: '0920000017', status: 'Học thử', hasDebt: false, className: classNames[4], classId: classIds[4], parentId: parentIds[6], birthDate: '2011-07-28', createdAt: recentDate },
    { name: 'Chu Thị Quỳnh', phone: '0920000018', status: 'Học thử', hasDebt: false, className: classNames[5], classId: classIds[5], parentId: parentIds[7], birthDate: '2010-11-12', createdAt: recentDate },
    { name: 'Từ Đức Anh', phone: '0920000019', status: 'Học thử', hasDebt: false, className: classNames[6], classId: classIds[6], parentId: parentIds[8], birthDate: '2009-04-25', createdAt: recentDate },
    { name: 'Lưu Phương Linh', phone: '0920000020', status: 'Học thử', hasDebt: false, className: classNames[7], classId: classIds[7], parentId: parentIds[9], birthDate: '2008-08-18', createdAt: recentDate },
    
    // Bảo lưu - 5 học viên
    { name: 'Mai Đình Khôi', phone: '0920000021', status: 'Bảo lưu', hasDebt: false, className: classNames[0], classId: classIds[0], parentId: parentIds[0], birthDate: '2015-02-20', createdAt: oldDate },
    { name: 'Dương Hải Yến', phone: '0920000022', status: 'Bảo lưu', hasDebt: false, className: classNames[1], classId: classIds[1], parentId: parentIds[1], birthDate: '2014-06-14', createdAt: oldDate },
    { name: 'Kiều Minh Phúc', phone: '0920000023', status: 'Bảo lưu', hasDebt: false, className: classNames[2], classId: classIds[2], parentId: parentIds[2], birthDate: '2013-10-28', createdAt: oldDate },
    { name: 'Tạ Thanh Tâm', phone: '0920000024', status: 'Bảo lưu', hasDebt: false, className: classNames[3], classId: classIds[3], parentId: parentIds[3], birthDate: '2012-01-05', createdAt: oldDate },
    { name: 'Quách Hồng Nhung', phone: '0920000025', status: 'Bảo lưu', hasDebt: false, className: classNames[4], classId: classIds[4], parentId: parentIds[4], birthDate: '2011-05-19', createdAt: oldDate },
    
    // Đã nghỉ - 4 học viên
    { name: 'Trịnh Tuấn Kiệt', phone: '0920000026', status: 'Đã nghỉ', hasDebt: false, className: classNames[0], classId: classIds[0], parentId: parentIds[5], birthDate: '2015-09-03', createdAt: oldDate },
    { name: 'Thái Bích Ngọc', phone: '0920000027', status: 'Đã nghỉ', hasDebt: false, className: classNames[1], classId: classIds[1], parentId: parentIds[6], birthDate: '2014-12-17', createdAt: oldDate },
    { name: 'La Văn Đạt', phone: '0920000028', status: 'Đã nghỉ', hasDebt: false, className: classNames[2], classId: classIds[2], parentId: parentIds[7], birthDate: '2013-04-30', createdAt: oldDate },
    { name: 'Mạc Thùy Dương', phone: '0920000029', status: 'Đã nghỉ', hasDebt: false, className: classNames[3], classId: classIds[3], parentId: parentIds[8], birthDate: '2012-08-11', createdAt: oldDate },
    
    // HV mới (Đang học, createdAt trong 30 ngày) - 10 học viên
    { name: 'Âu Minh Quân', phone: '0920000030', status: 'Đang học', hasDebt: false, className: classNames[0], classId: classIds[0], parentId: parentIds[9], birthDate: '2015-01-25', createdAt: recentDate },
    { name: 'Sầm Thanh Hằng', phone: '0920000031', status: 'Đang học', hasDebt: false, className: classNames[1], classId: classIds[1], parentId: parentIds[0], birthDate: '2014-05-08', createdAt: recentDate },
    { name: 'Ôn Gia Hân', phone: '0920000032', status: 'Đang học', hasDebt: false, className: classNames[2], classId: classIds[2], parentId: parentIds[1], birthDate: '2013-09-21', createdAt: recentDate },
    { name: 'Vi Đức Thịnh', phone: '0920000033', status: 'Đang học', hasDebt: false, className: classNames[3], classId: classIds[3], parentId: parentIds[2], birthDate: '2012-02-14', createdAt: recentDate },
    { name: 'Nông Khánh Vy', phone: '0920000034', status: 'Đang học', hasDebt: false, className: classNames[4], classId: classIds[4], parentId: parentIds[3], birthDate: '2011-06-28', createdAt: recentDate },
    { name: 'Giáp Minh Trí', phone: '0920000035', status: 'Đang học', hasDebt: false, className: classNames[5], classId: classIds[5], parentId: parentIds[4], birthDate: '2010-10-12', createdAt: recentDate },
    { name: 'Ứng Phương Thảo', phone: '0920000036', status: 'Đang học', hasDebt: false, className: classNames[6], classId: classIds[6], parentId: parentIds[5], birthDate: '2009-03-05', createdAt: recentDate },
    { name: 'Doãn Hoàng Long', phone: '0920000037', status: 'Đang học', hasDebt: false, className: classNames[7], classId: classIds[7], parentId: parentIds[6], birthDate: '2008-07-19', createdAt: recentDate },
    { name: 'Cù Ngọc Diệp', phone: '0920000038', status: 'Đang học', hasDebt: false, className: classNames[0], classId: classIds[0], parentId: parentIds[7], birthDate: '2015-11-02', createdAt: recentDate },
    { name: 'Khúc Văn Hưng', phone: '0920000039', status: 'Đang học', hasDebt: false, className: classNames[1], classId: classIds[1], parentId: parentIds[8], birthDate: '2014-04-16', createdAt: recentDate },
    
    // Active bình thường - 20 học viên
    { name: 'Lương Thu Trang', phone: '0920000040', status: 'Active', hasDebt: false, className: classNames[0], classId: classIds[0], parentId: parentIds[9], birthDate: '2015-08-29', createdAt: oldDate },
    { name: 'Châu Minh Hoàng', phone: '0920000041', status: 'Active', hasDebt: false, className: classNames[0], classId: classIds[0], parentId: parentIds[0], birthDate: '2015-12-13', createdAt: oldDate },
    { name: 'Thi Bảo Trân', phone: '0920000042', status: 'Active', hasDebt: false, className: classNames[1], classId: classIds[1], parentId: parentIds[1], birthDate: '2014-03-26', createdAt: oldDate },
    { name: 'Cung Đức Duy', phone: '0920000043', status: 'Active', hasDebt: false, className: classNames[1], classId: classIds[1], parentId: parentIds[2], birthDate: '2014-07-10', createdAt: oldDate },
    { name: 'Đàm Thúy An', phone: '0920000044', status: 'Active', hasDebt: false, className: classNames[2], classId: classIds[2], parentId: parentIds[3], birthDate: '2013-11-23', createdAt: oldDate },
    { name: 'Kha Minh Nhật', phone: '0920000045', status: 'Active', hasDebt: false, className: classNames[2], classId: classIds[2], parentId: parentIds[4], birthDate: '2013-04-07', createdAt: oldDate },
    { name: 'Nghiêm Hải Đăng', phone: '0920000046', status: 'Active', hasDebt: false, className: classNames[3], classId: classIds[3], parentId: parentIds[5], birthDate: '2012-08-20', createdAt: oldDate },
    { name: 'Biện Ngọc Huyền', phone: '0920000047', status: 'Active', hasDebt: false, className: classNames[3], classId: classIds[3], parentId: parentIds[6], birthDate: '2012-01-03', createdAt: oldDate },
    { name: 'Sử Quang Vinh', phone: '0920000048', status: 'Active', hasDebt: false, className: classNames[4], classId: classIds[4], parentId: parentIds[7], birthDate: '2011-05-17', createdAt: oldDate },
    { name: 'Âu Thị Hạnh', phone: '0920000049', status: 'Active', hasDebt: false, className: classNames[4], classId: classIds[4], parentId: parentIds[8], birthDate: '2011-09-30', createdAt: oldDate },
    { name: 'Khổng Minh Tuấn', phone: '0920000050', status: 'Active', hasDebt: false, className: classNames[5], classId: classIds[5], parentId: parentIds[9], birthDate: '2010-02-13', createdAt: oldDate },
    { name: 'Hà Khánh Ngân', phone: '0920000051', status: 'Active', hasDebt: false, className: classNames[5], classId: classIds[5], parentId: parentIds[0], birthDate: '2010-06-26', createdAt: oldDate },
    { name: 'Mã Đức Anh', phone: '0920000052', status: 'Active', hasDebt: false, className: classNames[6], classId: classIds[6], parentId: parentIds[1], birthDate: '2009-10-09', createdAt: oldDate },
    { name: 'Bành Thị Loan', phone: '0920000053', status: 'Active', hasDebt: false, className: classNames[6], classId: classIds[6], parentId: parentIds[2], birthDate: '2009-03-23', createdAt: oldDate },
    { name: 'Ninh Văn Phong', phone: '0920000054', status: 'Active', hasDebt: false, className: classNames[7], classId: classIds[7], parentId: parentIds[3], birthDate: '2008-07-06', createdAt: oldDate },
    { name: 'Cầm Thị Hà', phone: '0920000055', status: 'Active', hasDebt: false, className: classNames[7], classId: classIds[7], parentId: parentIds[4], birthDate: '2008-11-19', createdAt: oldDate },
    { name: 'Triệu Minh Khôi', phone: '0920000056', status: 'Active', hasDebt: false, className: classNames[0], classId: classIds[0], parentId: parentIds[5], birthDate: '2015-04-02', createdAt: oldDate },
    { name: 'Ông Thanh Thủy', phone: '0920000057', status: 'Active', hasDebt: false, className: classNames[1], classId: classIds[1], parentId: parentIds[6], birthDate: '2014-08-15', createdAt: oldDate },
    { name: 'Tống Gia Bảo', phone: '0920000058', status: 'Active', hasDebt: false, className: classNames[2], classId: classIds[2], parentId: parentIds[7], birthDate: '2013-12-28', createdAt: oldDate },
    { name: 'Lục Khánh Chi', phone: '0920000059', status: 'Active', hasDebt: false, className: classNames[3], classId: classIds[3], parentId: parentIds[8], birthDate: '2012-05-11', createdAt: oldDate },
  ];
};

// 9. Contracts - link to actual student's class
const generateContracts = (studentIds: string[], studentNames: string[], studentClassIds: string[], classNames: string[]) => {
  const now = new Date();
  const currentMonth = getCurrentMonth();
  
  // Create a map from classId to className
  const classIdToName = new Map<string, string>();
  studentClassIds.forEach((classId, idx) => {
    // Find the class name for this classId from the studentsData
    const classIndex = studentClassIds.indexOf(classId);
    if (!classIdToName.has(classId)) {
      // Get class name from the classes array based on index
      const classNameIndex = [...new Set(studentClassIds)].indexOf(classId);
      classIdToName.set(classId, classNames[classNameIndex] || `Class ${classNameIndex}`);
    }
  });
  
  return studentIds.slice(0, 40).map((studentId, idx) => {
    const classId = studentClassIds[idx];
    const className = classIdToName.get(classId) || '';
    
    return {
      code: `HD${currentMonth.replace('-', '')}${String(idx + 1).padStart(3, '0')}`,
      studentId,
      studentName: studentNames[idx],
      classId,              // FK → Classes (student's actual class)
      className,            // Denormalized
      startDate: getDateInMonth(1),
      endDate: `${now.getFullYear()}-${String(now.getMonth() + 4).padStart(2, '0')}-01`,
      tuition: [3500000, 4000000, 5000000, 6000000][idx % 4],
      discount: idx % 5 === 0 ? 500000 : 0,
      finalTotal: [3500000, 4000000, 5000000, 6000000][idx % 4] - (idx % 5 === 0 ? 500000 : 0),
      status: idx < 12 ? 'Nợ phí' : 'Đã thanh toán',
      paymentMethod: ['Tiền mặt', 'Chuyển khoản', 'Thẻ'][idx % 3],
      notes: '',
      createdAt: new Date(now.getTime() - (40 - idx) * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
};

// 10. Financial Transactions
const financialTransactions = [
  { category: 'Học phí', amount: 45000000, description: 'Học phí lớp Starter 1A', studentName: 'Nhiều học viên' },
  { category: 'Học phí', amount: 38000000, description: 'Học phí lớp Starter 1B', studentName: 'Nhiều học viên' },
  { category: 'Học phí', amount: 52000000, description: 'Học phí lớp Starter 2A', studentName: 'Nhiều học viên' },
  { category: 'Học phí', amount: 28000000, description: 'Học phí lớp Elementary 1A', studentName: 'Nhiều học viên' },
  { category: 'Học phí', amount: 35000000, description: 'Học phí lớp Elementary 2A', studentName: 'Nhiều học viên' },
  { category: 'Sách vở', amount: 12500000, description: 'Bán sách Academy Starter 1', studentName: 'Nhiều học viên' },
  { category: 'Sách vở', amount: 8700000, description: 'Bán sách Academy Starter 2', studentName: 'Nhiều học viên' },
  { category: 'Sách vở', amount: 15300000, description: 'Bán sách giáo trình mới', studentName: 'Nhiều học viên' },
  { category: 'Đồng phục', amount: 8500000, description: 'Bán đồng phục học viên mới', studentName: '25 học viên' },
  { category: 'Đồng phục', amount: 6200000, description: 'Bán đồng phục bổ sung', studentName: '18 học viên' },
  { category: 'Khác', amount: 5500000, description: 'Phí thi chứng chỉ Cambridge', studentName: '11 học viên' },
  { category: 'Khác', amount: 3800000, description: 'Phí hoạt động ngoại khóa', studentName: 'Lớp Intermediate' },
];

// 11. Leads (Customer Database)
const leads = [
  { name: 'Nguyễn Văn A', phone: '0931000001', email: 'a@gmail.com', source: 'Facebook', status: 'Mới', notes: 'Quan tâm lớp Starter' },
  { name: 'Trần Thị B', phone: '0931000002', email: 'b@gmail.com', source: 'Zalo', status: 'Đã liên hệ', notes: 'Hẹn gặp tuần sau' },
  { name: 'Lê Văn C', phone: '0931000003', email: 'c@gmail.com', source: 'Website', status: 'Quan tâm', notes: 'Muốn học thử' },
  { name: 'Phạm Thị D', phone: '0931000004', email: 'd@gmail.com', source: 'Giới thiệu', status: 'Hẹn gặp', notes: 'Bạn của phụ huynh lớp A' },
  { name: 'Hoàng Văn E', phone: '0931000005', email: 'e@gmail.com', source: 'Facebook', status: 'Học thử', notes: 'Đang học thử lớp Starter 1A' },
  { name: 'Vũ Thị F', phone: '0931000006', email: 'f@gmail.com', source: 'TikTok', status: 'Đăng ký', notes: 'Đã đăng ký chính thức' },
  { name: 'Đặng Văn G', phone: '0931000007', email: 'g@gmail.com', source: 'Google', status: 'Từ chối', notes: 'Không phù hợp lịch học' },
  { name: 'Bùi Thị H', phone: '0931000008', email: 'h@gmail.com', source: 'Zalo', status: 'Mới', notes: 'Cần tư vấn thêm' },
];

// 12. Campaigns
const campaigns = [
  { name: 'Ưu đãi Giáng sinh 2024', status: 'Đang mở', startDate: '2024-12-01', endDate: '2024-12-31', budget: 5000000, registered: 15, target: 30, scriptUrl: '' },
  { name: 'Học thử miễn phí', status: 'Đang mở', startDate: '2024-11-01', endDate: '2025-01-31', budget: 3000000, registered: 28, target: 50, scriptUrl: '' },
  { name: 'Back to School 2024', status: 'Kết thúc', startDate: '2024-08-01', endDate: '2024-09-30', budget: 8000000, registered: 45, target: 40, scriptUrl: '' },
];

// 13. Products
const products = [
  { name: 'Academy Starter 1', category: 'Sách', price: 250000, stock: 5, minStock: 10 },
  { name: 'Academy Starter 2', category: 'Sách', price: 250000, stock: 7, minStock: 10 },
  { name: 'Academy Elementary 1', category: 'Sách', price: 280000, stock: 12, minStock: 10 },
  { name: 'Academy Elementary 2', category: 'Sách', price: 280000, stock: 15, minStock: 10 },
  { name: 'Academy Intermediate', category: 'Sách', price: 320000, stock: 8, minStock: 10 },
  { name: 'Áo đồng phục S', category: 'Đồng phục', price: 150000, stock: 20, minStock: 15 },
  { name: 'Áo đồng phục M', category: 'Đồng phục', price: 150000, stock: 25, minStock: 15 },
  { name: 'Áo đồng phục L', category: 'Đồng phục', price: 160000, stock: 18, minStock: 15 },
  { name: 'Balo Brisky', category: 'Phụ kiện', price: 200000, stock: 10, minStock: 8 },
  { name: 'Vở ghi chép', category: 'Văn phòng phẩm', price: 25000, stock: 100, minStock: 50 },
];

// 14. Work Sessions
const generateWorkSessions = (staffIds: string[], staffNames: string[], classIds: string[], classNames: string[]) => {
  const currentMonth = getCurrentMonth();
  const sessions: any[] = [];
  
  // Generate work sessions for current month
  for (let day = 1; day <= 15; day++) {
    const date = getDateInMonth(day);
    staffIds.forEach((staffId, idx) => {
      if (idx < 5) { // Only teachers
        sessions.push({
          staffId,
          staffName: staffNames[idx],
          classId: classIds[idx % classIds.length],
          className: classNames[idx % classNames.length],
          date,
          month: currentMonth,
          workType: 'Dạy chính',
          status: day <= 10 ? 'Đã xác nhận' : 'Chờ xác nhận',
          salary: idx < 3 ? 150000 : 350000,
          studentCount: 8 + (idx % 5),
        });
      }
    });
  }
  
  return sessions;
};

// 15. Attendance Records - Class-level summaries
const generateAttendance = (classIds: string[], classNames: string[]) => {
  const currentMonth = getCurrentMonth();
  const records: any[] = [];
  
  for (let day = 1; day <= 10; day++) {
    const date = getDateInMonth(day);
    classIds.forEach((classId, classIdx) => {
      const totalStudents = 8 + (classIdx % 5); // 8-12 students per class
      const absent = classIdx % 3; // 0-2 absent
      const reserved = day % 5 === 0 ? 1 : 0; // some reserved students
      const present = totalStudents - absent - reserved;
      
      records.push({
        classId,
        className: classNames[classIdx] || `Lớp ${classIdx + 1}`,
        date,
        sessionNumber: day,
        totalStudents,
        present,
        absent,
        reserved,
        tutored: 0,
        status: 'Đã điểm danh',
        createdBy: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }
  
  return records;
};

// 16. Tutoring Records
const generateTutoring = (studentIds: string[], studentNames: string[]) => {
  const currentMonth = getCurrentMonth();
  return [
    { studentId: studentIds[0], studentName: studentNames[0], type: 'Nghỉ học', status: 'Chưa bồi', scheduledDate: null, reason: 'Nghỉ ốm', createdAt: getDateInMonth(5) },
    { studentId: studentIds[2], studentName: studentNames[2], type: 'Nghỉ học', status: 'Đã hẹn', scheduledDate: getDateInMonth(20), reason: 'Đi du lịch', createdAt: getDateInMonth(8) },
    { studentId: studentIds[5], studentName: studentNames[5], type: 'Học yếu', status: 'Đã bồi', scheduledDate: getDateInMonth(10), reason: 'Cần ôn lại ngữ pháp', createdAt: getDateInMonth(3) },
    { studentId: studentIds[8], studentName: studentNames[8], type: 'Học yếu', status: 'Chưa bồi', scheduledDate: null, reason: 'Yếu kỹ năng nghe', createdAt: getDateInMonth(12) },
  ];
};

// 17. Feedback
const generateFeedback = (studentIds: string[], studentNames: string[], parentIds: string[]) => {
  return [
    { studentId: studentIds[0], studentName: studentNames[0], parentId: parentIds[0], type: 'Call', status: 'Hoàn thành', score: 5, notes: 'Phụ huynh rất hài lòng', callDate: getDateInMonth(5) },
    { studentId: studentIds[1], studentName: studentNames[1], parentId: parentIds[1], type: 'Call', status: 'Đã gọi', score: 4, notes: 'Cần cải thiện bài tập về nhà', callDate: getDateInMonth(6) },
    { studentId: studentIds[2], studentName: studentNames[2], parentId: parentIds[2], type: 'Form', status: 'Hoàn thành', score: 4.5, notes: 'Feedback form tháng 12', responses: { quality: 5, teacher: 4, facility: 4 } },
    { studentId: studentIds[3], studentName: studentNames[3], parentId: parentIds[3], type: 'Call', status: 'Cần gọi', score: null, notes: 'Chưa liên hệ được', callDate: null },
  ];
};

// 18. Invoices
const generateInvoices = (studentIds: string[], studentNames: string[]) => {
  const currentMonth = getCurrentMonth();
  return [
    { 
      code: `INV${currentMonth.replace('-', '')}001`,
      studentId: studentIds[0],
      studentName: studentNames[0],
      items: [
        { name: 'Academy Starter 1', quantity: 1, price: 250000 },
        { name: 'Áo đồng phục M', quantity: 2, price: 150000 },
      ],
      total: 550000,
      status: 'Đã thanh toán',
      paymentDate: getDateInMonth(5),
      createdAt: getDateInMonth(3),
    },
    {
      code: `INV${currentMonth.replace('-', '')}002`,
      studentId: studentIds[1],
      studentName: studentNames[1],
      items: [
        { name: 'Academy Starter 2', quantity: 1, price: 250000 },
      ],
      total: 250000,
      status: 'Chờ thanh toán',
      paymentDate: null,
      createdAt: getDateInMonth(8),
    },
  ];
};

// ============ MAIN SEED FUNCTION ============

export const seedAllData = async () => {
  console.log('🚀 Starting comprehensive data seeding...\n');
  const results: Record<string, number> = {};
  
  try {
    // 1. Center Settings
    console.log('1. Seeding center settings...');
    await setDoc(doc(db, 'settings', 'center'), { ...centerSettings, updatedAt: new Date().toISOString() });
    results['centerSettings'] = 1;
    
    // 2. Branches
    console.log('2. Seeding branches...');
    const branchIds: string[] = [];
    for (const branch of branches) {
      const ref = await addDoc(collection(db, 'branches'), { ...branch, createdAt: new Date().toISOString() });
      branchIds.push(ref.id);
    }
    results['branches'] = branches.length;
    
    // 3. Curriculum
    console.log('3. Seeding curriculums...');
    const curriculumIds: string[] = [];
    for (const curr of curriculums) {
      const ref = await addDoc(collection(db, 'curriculums'), { ...curr, createdAt: new Date().toISOString() });
      curriculumIds.push(ref.id);
    }
    results['curriculums'] = curriculums.length;
    
    // 4. Salary Rules
    console.log('4. Seeding salary rules...');
    for (const rule of salaryRules) {
      await addDoc(collection(db, 'salaryRules'), { ...rule, createdAt: new Date().toISOString() });
    }
    results['salaryRules'] = salaryRules.length;
    
    // 5. Staff
    console.log('5. Seeding staff...');
    const staffIds: string[] = [];
    const staffNames: string[] = [];
    for (const s of staff) {
      const ref = await addDoc(collection(db, 'staff'), { ...s, createdAt: new Date().toISOString() });
      staffIds.push(ref.id);
      staffNames.push(s.name);
    }
    results['staff'] = staff.length;
    
    // 6. Classes - with proper FK relationships
    console.log('6. Seeding classes...');
    const classIds: string[] = [];
    const classNames: string[] = [];
    const staffMap = new Map(staff.map((s, i) => [s.name, staffIds[i]]));
    const curriculumMap = new Map(curriculums.map((c, i) => [c.name, curriculumIds[i]]));
    
    for (const cls of classes) {
      const teacherId = staffMap.get(cls.teacherName) || '';
      const assistantId = cls.assistantName ? staffMap.get(cls.assistantName) || '' : null;
      const curriculumId = curriculumMap.get(cls.curriculum) || '';
      
      const ref = await addDoc(collection(db, 'classes'), { 
        ...cls, 
        teacherId,           // FK → Staff
        assistantId,         // FK → Staff
        curriculumId,        // FK → Curriculum
        currentStudents: 0,
        status: 'Active', 
        createdAt: new Date().toISOString() 
      });
      classIds.push(ref.id);
      classNames.push(cls.name);
    }
    results['classes'] = classes.length;
    
    // 7. Parents
    console.log('7. Seeding parents...');
    const parentIds: string[] = [];
    for (const parent of parents) {
      const ref = await addDoc(collection(db, 'parents'), { ...parent, createdAt: new Date().toISOString() });
      parentIds.push(ref.id);
    }
    results['parents'] = parents.length;
    
    // 8. Students - with denormalized parent data
    console.log('8. Seeding students...');
    const studentIds: string[] = [];
    const studentNames: string[] = [];
    const studentClassIds: string[] = [];
    const studentsData = generateStudents(parentIds, classIds, classNames);
    const parentChildrenMap: Map<string, string[]> = new Map();
    const classStudentCount: Map<string, number> = new Map();
    
    for (const student of studentsData) {
      // Get parent info for denormalization
      const parentIndex = parentIds.indexOf(student.parentId);
      const parentData = parents[parentIndex] || parents[0];
      
      // Transform fields to match StudentManager expectations
      const { name, birthDate, ...rest } = student;
      
      const ref = await addDoc(collection(db, 'students'), {
        ...rest,
        fullName: name,                   // name → fullName
        dob: birthDate,                   // birthDate → dob
        parentName: parentData.name,      // Denormalized
        parentPhone: parentData.phone,    // Denormalized
      });
      studentIds.push(ref.id);
      studentNames.push(name);
      studentClassIds.push(student.classId);
      
      // Track children per parent
      const children = parentChildrenMap.get(student.parentId) || [];
      children.push(ref.id);
      parentChildrenMap.set(student.parentId, children);
      
      // Track students per class
      const count = classStudentCount.get(student.classId) || 0;
      classStudentCount.set(student.classId, count + 1);
    }
    
    // Update parent.childrenIds
    console.log('   Updating parent.childrenIds...');
    for (const [parentId, childrenIds] of parentChildrenMap) {
      await updateDoc(doc(db, 'parents', parentId), { childrenIds });
    }
    
    // Update class.currentStudents
    console.log('   Updating class.currentStudents...');
    for (const [classId, count] of classStudentCount) {
      await updateDoc(doc(db, 'classes', classId), { currentStudents: count });
    }
    
    results['students'] = studentsData.length;
    
    // 9. Contracts - with denormalized class data
    console.log('9. Seeding contracts...');
    const contractIds: string[] = [];
    const contractsData = generateContracts(studentIds, studentNames, studentClassIds, classNames);
    for (const contract of contractsData) {
      const ref = await addDoc(collection(db, 'contracts'), contract);
      contractIds.push(ref.id);
    }
    results['contracts'] = contractsData.length;
    
    // 10. Financial Transactions
    console.log('10. Seeding financial transactions...');
    const currentMonth = getCurrentMonth();
    let dayCounter = 1;
    for (const transaction of financialTransactions) {
      await addDoc(collection(db, 'financialTransactions'), {
        ...transaction,
        type: 'income',
        date: getDateInMonth(dayCounter),
        month: currentMonth,
        createdAt: new Date().toISOString(),
      });
      dayCounter = (dayCounter % 28) + 1;
    }
    results['financialTransactions'] = financialTransactions.length;
    
    // 11. Leads
    console.log('11. Seeding leads...');
    for (const lead of leads) {
      await addDoc(collection(db, 'leads'), { ...lead, createdAt: new Date().toISOString() });
    }
    results['leads'] = leads.length;
    
    // 12. Campaigns
    console.log('12. Seeding campaigns...');
    for (const campaign of campaigns) {
      await addDoc(collection(db, 'campaigns'), { ...campaign, createdAt: new Date().toISOString() });
    }
    results['campaigns'] = campaigns.length;
    
    // 13. Products
    console.log('13. Seeding products...');
    for (const product of products) {
      await addDoc(collection(db, 'products'), { ...product, createdAt: new Date().toISOString() });
    }
    results['products'] = products.length;
    
    // 14. Work Sessions
    console.log('14. Seeding work sessions...');
    const workSessionsData = generateWorkSessions(staffIds, staffNames, classIds, classNames);
    for (const session of workSessionsData) {
      await addDoc(collection(db, 'workSessions'), session);
    }
    results['workSessions'] = workSessionsData.length;
    
    // 15. Attendance
    console.log('15. Seeding attendance records...');
    const attendanceData = generateAttendance(classIds, classNames);
    for (const record of attendanceData) {
      await addDoc(collection(db, 'attendance'), record);
    }
    results['attendance'] = attendanceData.length;
    
    // 16. Tutoring
    console.log('16. Seeding tutoring records...');
    const tutoringData = generateTutoring(studentIds, studentNames);
    for (const record of tutoringData) {
      await addDoc(collection(db, 'tutoring'), { ...record, month: currentMonth });
    }
    results['tutoring'] = tutoringData.length;
    
    // 17. Feedback
    console.log('17. Seeding feedback...');
    const feedbackData = generateFeedback(studentIds, studentNames, parentIds);
    for (const fb of feedbackData) {
      await addDoc(collection(db, 'feedback'), { ...fb, month: currentMonth, createdAt: new Date().toISOString() });
    }
    results['feedback'] = feedbackData.length;
    
    // 18. Invoices
    console.log('18. Seeding invoices...');
    const invoicesData = generateInvoices(studentIds, studentNames);
    for (const invoice of invoicesData) {
      await addDoc(collection(db, 'invoices'), invoice);
    }
    results['invoices'] = invoicesData.length;
    
    // Summary
    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('─'.repeat(40));
    Object.entries(results).forEach(([key, count]) => {
      console.log(`   ${key}: ${count} records`);
    });
    console.log('─'.repeat(40));
    console.log(`   Total: ${Object.values(results).reduce((a, b) => a + b, 0)} records`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
};

// Clear all data (preserves admin staff)
export const clearAllData = async () => {
  console.log('🗑️ Clearing all data...\n');
  
  const collections = [
    'students', 'parents', 'classes', 'contracts',
    'financialTransactions', 'leads', 'campaigns', 'products',
    'workSessions', 'attendance', 'tutoring', 'feedback', 'invoices',
    'curriculums', 'salaryRules', 'branches',
    // Additional collections
    'classSessions', 'enrollments', 'studentAttendance', 
    'homeworkRecords', 'testComments', 'monthlyComments',
    'birthdayGifts', 'staffRewardPenalty', 'rewardPenaltyConfig',
    'homeworkStatuses', 'centers', 'holidays', 'rooms',
    'attendanceAuditLog', 'staffAttendance', 'actualSalaries',
    'salaryRanges', 'staffSalaries', 'feedbacks'
  ];
  
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, col, d.id));
      }
      console.log(`   Cleared ${col}: ${snap.size} records`);
    } catch (err) {
      console.log(`   Skipped ${col}: collection may not exist`);
    }
  }
  
  // Clear staff but preserve admin users
  try {
    const staffSnap = await getDocs(collection(db, 'staff'));
    let deleted = 0;
    for (const d of staffSnap.docs) {
      const data = d.data();
      // Preserve admin users
      if (data.position === 'Quản trị viên' || data.role === 'admin') {
        console.log(`   Preserved admin: ${data.name}`);
        continue;
      }
      await deleteDoc(doc(db, 'staff', d.id));
      deleted++;
    }
    console.log(`   Cleared staff: ${deleted} records (admins preserved)`);
  } catch (err) {
    console.log(`   Skipped staff: error occurred`);
  }
  
  console.log('\n✅ All data cleared!');
};

export default seedAllData;

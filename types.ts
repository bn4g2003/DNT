
export enum ClassStatus {
  STUDYING = 'Đang học',
  FINISHED = 'Kết thúc',
  PAUSED = 'Tạm dừng',
  PENDING = 'Chờ mở'
}

export enum StudentStatus {
  ACTIVE = 'Đang học',
  DEBT = 'Nợ phí',
  CONTRACT_DEBT = 'Nợ hợp đồng',
  RESERVED = 'Bảo lưu',
  DROPPED = 'Nghỉ học',
  TRIAL = 'Học thử',
  EXPIRED_FEE = 'Đã học hết phí'
}

export enum AttendanceStatus {
  PENDING = '',
  ON_TIME = 'Đúng giờ',
  LATE = 'Trễ giờ',
  ABSENT = 'Vắng',
  RESERVED = 'Bảo lưu',
  TUTORED = 'Đã bồi'
}

export interface ClassSession {
  id: string;
  className: string;
  room: string;
  teacher: string;
  time: string;
  dayOfWeek: string;
}

export interface Student {
  id: string;
  code: string;
  fullName: string;
  dob: string; // ISO date
  gender: 'Nam' | 'Nữ';
  phone: string;
  password?: string; // Mật khẩu đăng nhập portal (mặc định: 123456)
  parentId?: string; // Reference to parents collection
  parentName?: string; // Denormalized for display (auto-synced)
  parentPhone?: string; // Denormalized for display (auto-synced)
  status: StudentStatus;
  careHistory: CareLog[];
  branch?: string; // Cơ sở học
  class?: string; // Current class name (legacy)
  classId?: string; // Primary class ID
  classIds?: string[]; // All enrolled class IDs (for multi-class support)
  registeredSessions?: number; // Số buổi đã đăng ký/đóng tiền
  attendedSessions?: number; // Số buổi đã học (tự động tính từ điểm danh)
  remainingSessions?: number; // Số buổi còn lại (âm = nợ phí, auto set status)
  startSessionNumber?: number; // Buổi học bắt đầu (khi đăng ký giữa khoá)
  enrollmentDate?: string; // Ngày đăng ký
  startDate?: string; // Ngày bắt đầu học
  expectedEndDate?: string; // Ngày kết thúc dự kiến (tự động tính)
  reserveDate?: string; // Ngày bảo lưu
  reserveNote?: string; // Ghi chú bảo lưu  
  reserveSessions?: number; // Số buổi bảo lưu

  // Nợ xấu
  badDebt?: boolean; // Tick nợ xấu (học sinh nghỉ học nhưng còn nợ)
  badDebtSessions?: number; // Số buổi nợ
  badDebtAmount?: number; // Số tiền nợ xấu (sessions x 150k)
  badDebtDate?: string; // Ngày ghi nhận nợ xấu
  badDebtNote?: string; // Ghi chú nợ xấu

  // Nợ hợp đồng (trả góp)
  contractDebt?: number; // Số tiền còn nợ hợp đồng
  nextPaymentDate?: string; // Ngày hẹn thanh toán tiếp theo
}

export interface CareLog {
  id: string;
  date: string;
  type: 'Bồi bài' | 'Phản hồi' | 'Tư vấn';
  content: string;
  staff: string;
}

// Cấu hình lịch học chi tiết cho từng ngày trong tuần
export interface DayScheduleConfig {
  dayOfWeek: string; // '2', '3', '4', '5', '6', '7', 'CN'
  dayLabel: string; // 'Thứ 2', 'Thứ 3'...
  startTime: string; // '18:00'
  endTime: string; // '19:30'
  room?: string; // Phòng học (có thể khác mỗi ngày)
  // Giáo viên Việt Nam
  teacherId?: string;
  teacher?: string;
  teacherDuration?: number; // phút
  // Trợ giảng
  assistantId?: string;
  assistant?: string;
  assistantDuration?: number; // phút
  // Giáo viên nước ngoài
  foreignTeacherId?: string;
  foreignTeacher?: string;
  foreignTeacherDuration?: number; // phút
}

// Lịch sử thay đổi lớp học (giáo viên, lịch học, phòng học...)
export interface TrainingHistoryEntry {
  id: string;
  date: string; // ISO date khi thay đổi
  type: 'schedule_change' | 'teacher_change' | 'room_change' | 'status_change' | 'other';
  description: string; // Mô tả chi tiết
  oldValue?: string; // Giá trị cũ
  newValue?: string; // Giá trị mới
  changedBy?: string; // Người thay đổi
  note?: string; // Ghi chú thêm
}

export interface ClassModel {
  id: string;
  name: string;
  status: ClassStatus;
  curriculum: string;
  courseId?: string; // ID khóa học liên kết
  courseName?: string; // Tên khóa học (denormalized)
  ageGroup: string;
  progress: string; // e.g., "12/24 Buổi"
  totalSessions?: number; // Tổng số buổi học của lớp
  teacher: string;
  teacherId?: string;
  teacherDuration?: number; // Thời lượng dạy của GV VN (phút)
  assistant: string;
  assistantDuration?: number; // Thời lượng dạy của trợ giảng (phút)
  foreignTeacher?: string;
  foreignTeacherDuration?: number; // Thời lượng dạy của GVNN (phút)
  studentsCount: number;
  trialStudents?: number;
  activeStudents?: number;
  debtStudents?: number;
  reservedStudents?: number;
  schedule?: string; // Lịch học tổng quát, e.g., "Thứ 2, 4 (18h-19h30)"
  scheduleDetails?: DayScheduleConfig[]; // Chi tiết lịch học theo từng ngày (NEW)
  room?: string; // Phòng mặc định (legacy)
  branch?: string; // Cơ sở
  color?: number; // Index màu trong palette (0-15), undefined = auto từ tên lớp
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
  trainingHistory?: TrainingHistoryEntry[]; // Lịch sử đào tạo
}

export type StaffRole = 'Giáo viên' | 'Trợ giảng' | 'Nhân viên' | 'Sale' | 'Văn phòng' | 'Quản lý' | 'Quản trị viên';

export type StaffContractType = 'Thử việc' | 'Chính thức' | 'Cộng tác viên' | 'Thời vụ';
export type StaffContractStatus = 'Đang hiệu lực' | 'Hết hạn' | 'Đã chấm dứt';

export interface Staff {
  id: string;
  name: string;
  code: string;
  // Support multiple roles
  roles?: StaffRole[];
  // Legacy single role (for backward compatibility)
  role: StaffRole;
  department: string;
  position: string;
  phone: string;
  email?: string;
  status: 'Active' | 'Inactive';
  dob?: string;
  startDate?: string;
  branch?: string; // Cơ sở làm việc

  // Thông tin lý lịch mở rộng
  gender?: 'Nam' | 'Nữ';
  idNumber?: string; // CCCD/CMND
  idIssueDate?: string;
  idIssuePlace?: string;
  address?: string;
  permanentAddress?: string;
  bankAccount?: string;
  bankName?: string;
  taxCode?: string;
  insuranceNumber?: string;

  // Bằng cấp, trình độ
  education?: string; // Trình độ học vấn
  degree?: string; // Bằng cấp
  major?: string; // Chuyên ngành
  certificates?: string[]; // Chứng chỉ

  // Thông tin lương
  salaryGrade?: number; // Bậc lương (1-8)
  baseSalary?: number; // Lương cơ bản
  allowance?: number; // Phụ cấp

  // Thông tin hợp đồng hiện tại
  currentContractId?: string;
  currentContractType?: StaffContractType;
  contractStartDate?: string;
  contractEndDate?: string;

  // Metadata
  avatar?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Hợp đồng lao động
export interface StaffContract {
  id: string;
  staffId: string;
  staffName: string;
  staffCode: string;
  contractNumber: string;
  contractType: StaffContractType;
  status: StaffContractStatus;
  startDate: string;
  endDate?: string; // Không có = vô thời hạn
  position: string;
  department: string;
  baseSalary: number;
  allowance?: number;
  probationSalary?: number; // Lương thử việc (nếu có)
  workingHours?: string; // Giờ làm việc
  benefits?: string; // Quyền lợi
  terms?: string; // Điều khoản
  signedDate: string;
  signedBy?: string;
  attachments?: string[]; // File đính kèm
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Ứng viên
export type CandidateStatus = 'Mới' | 'Đang xem xét' | 'Phỏng vấn' | 'Đạt' | 'Không đạt' | 'Đã tuyển';

export interface Candidate {
  id: string;
  name: string;
  code?: string;
  phone: string;
  email?: string;
  dob?: string;
  gender?: 'Nam' | 'Nữ';
  address?: string;

  // Thông tin ứng tuyển
  applyPosition: string; // Vị trí ứng tuyển
  applyDepartment?: string;
  expectedSalary?: number; // Lương mong muốn
  availableDate?: string; // Ngày có thể bắt đầu

  // Trình độ
  education?: string;
  degree?: string;
  major?: string;
  experience?: string; // Kinh nghiệm
  skills?: string[];
  certificates?: string[];

  // Trạng thái
  status: CandidateStatus;
  source?: string; // Nguồn ứng viên
  referredBy?: string; // Người giới thiệu

  // Lịch sử phỏng vấn
  interviewHistory?: {
    date: string;
    interviewer: string;
    result: string;
    notes?: string;
  }[];

  // File
  cvUrl?: string;
  attachments?: string[];

  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Thang lương
export interface SalaryScale {
  id: string;
  staffId?: string; // Nếu null = thang lương chung
  staffName?: string;
  name: string; // Tên thang lương (VD: "Thang lương GV", "Thang lương NV")
  baseAmount: number; // Mức lương bậc I
  grades: {
    grade: number; // Bậc (1-8)
    coefficient: number; // Hệ số
    amount: number; // Mức lương = hệ số * baseAmount
  }[];
  effectiveDate: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type HolidayApplyType = 'all_classes' | 'specific_classes' | 'specific_branch' | 'all_branches';

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Đã áp dụng' | 'Chưa áp dụng';
  applyType: HolidayApplyType;
  classIds?: string[]; // Khi applyType = 'specific_classes'
  classNames?: string[]; // Tên lớp để hiển thị
  branch?: string; // Khi applyType = 'specific_branch'
  affectedSessionIds?: string[]; // Các session đã bị ảnh hưởng (để revert)
  date?: string; // Legacy field for ordering
  createdAt?: string;
}

export interface TutoringSession {
  id: string;
  studentName: string;
  className: string;
  date: string;
  time: string;
  teacher: string;
  content: string;
  status: 'Đã hẹn' | 'Hoàn thành' | 'Hủy';
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  className: string;
  date: string;
  sessionNumber?: number | null;
  sessionId?: string | null;
  totalStudents: number;
  present: number;
  absent: number;
  reserved: number;
  tutored: number;
  status: 'Đã điểm danh' | 'Chưa điểm danh';
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAttendance {
  id?: string;
  attendanceId: string;
  sessionId?: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classId?: string;
  className?: string;
  date?: string;
  sessionNumber?: number;
  status: AttendanceStatus;
  note?: string;

  // Thông tin điểm số buổi học
  homeworkCompletion?: number;  // % BTVN (0-100)
  testName?: string;            // Tên bài KT (nếu có)
  score?: number;               // Điểm (0-10)
  bonusPoints?: number;         // Điểm thưởng

  // Thông tin đúng giờ / trễ giờ
  punctuality?: 'onTime' | 'late' | '';  // Đúng giờ / Trễ giờ
  isLate?: boolean;             // Đi trễ (legacy)

  createdAt?: string;
  updatedAt?: string;
}

// Nhận xét cuối tháng của giáo viên
export interface MonthlyComment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  month: number;              // 1-12
  year: number;               // 2025

  // Nhận xét từ giáo viên
  teacherComment?: string;
  teacherId?: string;
  teacherName?: string;

  // Nhận xét AI (có thể generate)
  aiComment?: string;

  // Metadata
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

// Thống kê báo cáo tháng
export interface MonthlyReportStats {
  totalSessions: number;        // Tổng số buổi
  attendedSessions: number;     // Số buổi có mặt
  absentSessions: number;       // Số buổi vắng
  attendanceRate: number;       // Tỉ lệ tham gia (%)
  averageScore: number | null;  // Điểm trung bình
  totalBonusPoints: number;     // Tổng điểm thưởng
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Sách' | 'Đồng phục' | 'Học liệu' | 'Khác';
  stock: number; // Tổng tồn kho (deprecated - dùng branchStock)
  branchStock?: Record<string, number>; // Tồn kho theo cơ sở { branchId: quantity }
  status: 'Kích hoạt' | 'Tạm khoá';
}

export interface InventoryTransfer {
  id: string;
  productId: string;
  productName: string;
  fromBranch: string;
  toBranch: string;
  quantity: number;
  transferDate: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'Văn phòng' | 'Phòng học' | 'Phòng chức năng';
  capacity?: number;
  status: 'Hoạt động' | 'Bảo trì';
  branch?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnrollmentRecord {
  id: string;
  studentName: string;
  studentId?: string;
  classId?: string;
  className?: string;
  sessions: number;
  type: 'Hợp đồng mới' | 'Hợp đồng tái phí' | 'Hợp đồng liên kết' | 'Thanh toán thêm' | 'Ghi danh thủ công' | 'Tặng buổi' | 'Nhận tặng buổi' | 'Chuyển lớp' | 'Xóa khỏi lớp';
  contractCode?: string;
  contractId?: string;
  originalAmount?: number;
  finalAmount?: number;
  createdDate?: string;
  createdAt?: string;
  createdBy: string;
  staff?: string; // Alias for createdBy for display
  note?: string;
  notes?: string; // Alias
  reason?: string; // Lý do thay đổi
}

export interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  relationship?: 'Bố' | 'Mẹ' | 'Ông/Bà' | 'Khác';
  createdAt?: string;
  updatedAt?: string;
  // children will be queried from students collection by parentId
}

export interface FeedbackRecord {
  id: string;
  date: string;
  type: 'Call' | 'Form';
  studentId?: string;
  studentName: string;
  classId?: string;
  className: string;
  teacher?: string;
  teacherScore?: number;
  curriculumScore?: number;
  careScore?: number;
  facilitiesScore?: number;
  averageScore?: number;
  caller?: string; // For Call type
  content?: string; // For Call type
  status: 'Cần gọi' | 'Đã gọi' | 'Hoàn thành';
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryRule {
  id: string;
  staffName: string;
  dob: string;
  position: 'Giáo Viên Việt' | 'Giáo Viên Nước Ngoài' | 'Trợ Giảng';
  class: string;
  salaryMethod: 'Theo ca' | 'Theo giờ' | 'Nhận xét' | 'Dạy chính';
  baseRate: number;
  workMethod: 'Cố định' | 'Theo sĩ số';
  avgStudents: number;
  ratePerSession: number;
  effectiveDate: string;
}

export interface SalaryRangeConfig {
  id: string;
  type: 'Teaching' | 'AssistantFeedback';
  rangeLabel: string;
  method?: string;
  amount: number;
}

export interface WorkSession {
  id: string;
  staffName: string;
  position: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  className: string;
  type: 'Dạy chính' | 'Nhận xét' | 'Trợ giảng';
  status: 'Đã xác nhận' | 'Chờ xác nhận';
}

export interface SalarySummary {
  id: string;
  staffName: string;
  dob: string;
  position: 'Giáo Viên Việt' | 'Giáo Viên Nước Ngoài' | 'Trợ Giảng';
  estimatedSalary: number;
  expectedSalary: number;
  kpiBonus?: number;
}

export interface SalaryDetailItem {
  id: string;
  date: string;
  time: string;
  className: string;
  studentCount?: number;
  salary: number;
  mainSalary?: number; // For Assistant
  feedbackSalary?: number; // For Assistant
  type?: string; // e.g., 'Bồi bài', 'Dạy chính'
}

export interface StaffSalaryRecord {
  id: string;
  staffName: string;
  position: string;
  baseSalary: number;
  workDays: number;
  commission: number;
  allowance: number;
  deduction: number;
  totalSalary: number;
}

export interface StaffAttendanceLog {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Đúng giờ' | 'Đi muộn' | 'Về sớm' | 'Nghỉ phép';
  note?: string;
}

export type MenuItem = {
  id: string;
  label: string;
  icon: any;
  path?: string;
  subItems?: MenuItem[];
};

// ==========================================
// CONTRACT TYPES
// ==========================================

export enum ContractType {
  STUDENT = 'Học viên',
  PRODUCT = 'Học liệu'
}

export enum ContractCategory {
  NEW = 'Hợp đồng mới',
  RENEWAL = 'Hợp đồng tái phí',
  MIGRATION = 'Hợp đồng liên kết'
}

export enum ContractStatus {
  DRAFT = 'Lưu nháp',
  PENDING = 'Chờ thanh toán',
  PAID = 'Đã thanh toán',
  PARTIAL = 'Nợ hợp đồng',
  CANCELLED = 'Đã hủy'
}

export enum PaymentMethod {
  FULL = 'Toàn bộ',
  INSTALLMENT = 'Trả góp',
  TRANSFER = 'Chuyển khoản',
  CASH = 'Tiền mặt'
}

export interface Course {
  id: string;
  code: string;
  name: string;
  totalSessions: number;
  pricePerSession: number;
  totalPrice: number;
  curriculum?: string;
  level?: string;
  ageGroup?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ContractItem {
  type: 'course' | 'product';
  id: string;
  name: string;
  classId?: string;
  className?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discount: number; // 0-1 (0.2 = 20%)
  finalPrice: number;
  debtSessions?: number;
  startDate?: string;
  endDate?: string;
}

export interface Contract {
  id: string;
  code: string;
  type: ContractType;
  category?: ContractCategory; // Loại hợp đồng: mới, tái phí, liên kết

  // Student Info
  studentId?: string;
  studentName?: string;
  studentDOB?: string;
  parentName?: string;
  parentPhone?: string;

  // Items
  items: ContractItem[];

  // Financial
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  totalAmountInWords: string;

  // Payment
  paymentMethod: PaymentMethod;
  paidAmount: number;
  remainingAmount: number;

  // Dates
  contractDate: string;
  startDate?: string; // Ngày bắt đầu hợp đồng
  paymentDate?: string;
  nextPaymentDate?: string; // Ngày hẹn thanh toán tiếp theo (cho nợ hợp đồng)

  // Class Info
  classId?: string;
  className?: string;

  // Session Info (for financial reports)
  totalSessions?: number;
  pricePerSession?: number;

  // Status
  status: ContractStatus;

  // Notes
  notes?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ContractPayment {
  id: string;
  contractId: string;
  contractCode: string;
  amount: number;
  paymentMethod: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ';
  paymentDate: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface BirthdayGift {
  id: string;
  studentId: string;
  studentName: string;
  year: number;
  month: number;
  giftPrepared: boolean;
  giftGiven: boolean;
  preparedAt?: string;
  givenAt?: string;
  preparedBy?: string;
  givenBy?: string;
  note?: string;
}


// ==========================================
// RESOURCE LIBRARY TYPES (Thư viện tài nguyên)
// ==========================================

export type ResourceType = 'video' | 'document' | 'link' | 'image' | 'audio';

export interface ResourceFolder {
  id: string;
  name: string;
  parentId?: string; // null = root folder
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  folderId?: string; // null = root
  url?: string; // For links, videos
  fileUrl?: string; // For uploaded files
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  duration?: number; // For video/audio in seconds
  viewCount?: number;
  downloadCount?: number;
  isPublic?: boolean; // Visible to students
  allowedRoles?: string[]; // Which roles can access
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

// ==========================================
// COURSE MANAGEMENT TYPES (Quản lý khóa học)
// ==========================================

export interface CourseStatistics {
  id: string;
  courseId: string;
  courseName: string;
  level: string;
  totalSessions: number;
  teacherRatio: number; // % giáo viên
  assistantRatio: number; // % trợ giảng
  curriculum: string; // Giáo trình
  resourceFolderId?: string; // Thư mục tài nguyên liên kết
  resourceFolderName?: string; // Tên thư mục (denormalized)
  pricePerSession: number;
  originalPrice: number;
  discount: number; // %
  tuitionFee: number;
  tuitionPerSession: number;
  startDate: string;
  endDate: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  droppedStudents: number;
  completionRate: number;
  averageAttendance: number;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// TEACHER REPORT TYPES (Báo cáo giáo viên)
// ==========================================

export interface TeacherDetailReport {
  id: string;
  teacherId: string;
  teacherName: string;
  totalClasses: number; // Tổng lớp đang dạy
  totalSessions: number; // Tổng số buổi dạy
  totalStudents: number; // Tổng số học viên đang dạy
  droppedStudents: number; // Tổng số học viên nghỉ ngang
  standardRate: number; // Tỷ lệ học viên đạt tiêu chuẩn (%)
  attendanceRate: number; // Tỷ lệ học viên đi học/tổng số buổi đã dạy (%)
  homeworkRate: number; // Tỷ lệ học viên làm btvn/tổng btvn được giao (%)
  averageTestScore: number; // Điểm Test trung bình của học viên
  managerNote?: string; // Đánh giá (quản lý ghi)
  period?: string; // Kỳ báo cáo (tháng/quý)
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// TASK MANAGEMENT TYPES (Quản lý Task)
// ==========================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TeacherTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[]; // Staff IDs (giáo viên/trợ giảng)
  assignedNames?: string[]; // Denormalized names
  status: TaskStatus;
  priority: TaskPriority;
  progress: number; // 0-100%
  dueDate?: string;
  completedDate?: string;
  result?: string; // Kết quả
  note?: string; // Ghi chú
  attachments?: string[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  staffId: string;
  staffName: string;
  role: 'Giáo viên' | 'Trợ giảng';
  progress: number; // 0-100%
  result?: number; // Kết quả công việc (%)
  note?: string;
  completedAt?: string;
}

// ==========================================
// GOAL/KPI MANAGEMENT TYPES (Quản lý mục tiêu)
// ==========================================

export interface TeacherGoal {
  id: string;
  title: string;
  description?: string;
  staffId: string;
  staffName: string;
  staffRole: 'Giáo viên' | 'Trợ giảng';
  kpiTarget: number; // Mục tiêu KPI
  kpiWeight: number; // Tỷ trọng tập trung mục tiêu (%)
  kpiActual: number; // Thực tế
  kpiResult: number; // Kết quả (%)
  period: string; // Kỳ đánh giá (tháng/quý)
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface TeacherPerformance {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: 'Giáo viên' | 'Trợ giảng';
  period: string; // Kỳ đánh giá
  taskResult: number; // Kết quả công việc (%)
  goalResult: number; // Kết quả mục tiêu (%)
  finalResult: number; // Kết quả = (% công việc + % mục tiêu) / 2
  managerNote?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// DEPARTMENT KPI/ERS TYPES (Hệ thống đánh giá hiệu quả công việc)
// ==========================================

export type DepartmentCode = 'sales' | 'training' | 'marketing' | 'accounting' | 'hr';

export const DEPARTMENT_LABELS: Record<DepartmentCode, string> = {
  sales: 'Kinh doanh',
  training: 'Chuyên môn',
  marketing: 'Marketing',
  accounting: 'Kế toán',
  hr: 'Nhân sự'
};

// Mục tiêu KPI theo phòng ban
export interface DepartmentGoal {
  id: string;
  departmentCode: DepartmentCode;
  departmentName: string;
  month: number;           // 1-12
  year: number;            // 2024, 2025...
  title: string;           // Tên mục tiêu
  description?: string;    // Mô tả
  kpiTarget: number;       // Chỉ tiêu KPI (số hoặc %)
  kpiWeight: number;       // Tỷ trọng tập trung mục tiêu (%)
  kpiActual: number;       // Thực tế đạt được
  kpiResult: number;       // Kết quả (%) = (actual/target) * 100
  unit?: string;           // Đơn vị (VNĐ, %, người...)
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

// Tổng hợp kết quả phòng ban theo tháng
export interface DepartmentMonthlyResult {
  id: string;
  departmentCode: DepartmentCode;
  departmentName: string;
  month: number;
  year: number;
  totalGoals: number;
  completedGoals: number;
  overallResult: number;   // Kết quả tổng (%) = trung bình có trọng số
  createdAt: string;
  updatedAt?: string;
}

// Khung thưởng KPI theo phòng ban
export interface KpiBonusLevel {
  level: number;           // 1-6
  minPercent: number;      // Phần trăm tối thiểu
  maxPercent: number;      // Phần trăm tối đa
  label: string;           // "Trên 120%", "100%-120%"...
  bonusMultiplier: number; // Hệ số thưởng
  bonusAmount: number;     // Số tiền thưởng
  note?: string;           // Ghi chú
}

export interface DepartmentBonusConfig {
  id: string;
  departmentCode: DepartmentCode;
  departmentName: string;
  levels: KpiBonusLevel[];
  effectiveDate: string;   // Ngày hiệu lực
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

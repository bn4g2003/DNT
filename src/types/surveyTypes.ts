/**
 * Survey Types
 * Types cho hệ thống form khảo sát có sẵn (templates)
 */

// Loại câu hỏi
export type SurveyQuestionType = 'score' | 'text' | 'choice' | 'rating';

// Câu hỏi trong form
export interface SurveyQuestion {
  id: string;
  question: string;
  type: SurveyQuestionType;
  category?: 'teacher' | 'curriculum' | 'care' | 'facilities' | 'general';
  options?: string[];  // Cho type = 'choice'
  required: boolean;
  order: number;
}

// Form Template (mẫu form có sẵn - Admin tạo)
export interface SurveyTemplate {
  id: string;
  name: string;
  description?: string;
  questions: SurveyQuestion[];
  isDefault?: boolean;  // Form mặc định
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}

// Survey Assignment - Gán form cho học viên
export interface SurveyAssignment {
  id: string;
  templateId: string;
  templateName: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  classId?: string;
  className?: string;
  status: 'pending' | 'submitted' | 'expired';
  token: string;  // Unique token để truy cập
  assignedAt: string;
  assignedBy?: string;
  expiresAt?: string;
  submittedAt?: string;
}

// Survey Response - Câu trả lời của học viên
export interface SurveyResponse {
  id: string;
  assignmentId: string;
  templateId: string;
  templateName: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  classId?: string;
  className?: string;
  
  // Điểm theo category (để tương thích với dashboard)
  teacherScore?: number;
  curriculumScore?: number;
  careScore?: number;
  facilitiesScore?: number;
  averageScore?: number;
  
  // Chi tiết câu trả lời
  answers: Record<string, string | number>;
  comments?: string;
  
  // Metadata
  submittedAt: string;
  submittedBy: 'student' | 'parent';
  submitterName?: string;
  submitterPhone?: string;
}

// Default templates
export const DEFAULT_SURVEY_TEMPLATES: Omit<SurveyTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Khảo sát chất lượng dịch vụ',
    description: 'Form khảo sát tiêu chuẩn về chất lượng giảng dạy và dịch vụ',
    questions: [
      { id: 'teacher', question: 'Đánh giá về giáo viên (phương pháp giảng dạy, sự nhiệt tình)', type: 'score', category: 'teacher', required: true, order: 1 },
      { id: 'curriculum', question: 'Đánh giá về chương trình học / tiến bộ của con', type: 'score', category: 'curriculum', required: true, order: 2 },
      { id: 'care', question: 'Đánh giá về dịch vụ chăm sóc khách hàng', type: 'score', category: 'care', required: true, order: 3 },
      { id: 'facilities', question: 'Đánh giá về cơ sở vật chất', type: 'score', category: 'facilities', required: true, order: 4 },
      { id: 'comments', question: 'Ý kiến đóng góp khác', type: 'text', category: 'general', required: false, order: 5 },
    ],
    isDefault: true,
    status: 'active',
  },
  {
    name: 'Khảo sát cuối khóa',
    description: 'Form khảo sát khi học viên hoàn thành khóa học',
    questions: [
      { id: 'overall', question: 'Đánh giá tổng thể về khóa học', type: 'score', category: 'general', required: true, order: 1 },
      { id: 'teacher', question: 'Đánh giá về giáo viên', type: 'score', category: 'teacher', required: true, order: 2 },
      { id: 'progress', question: 'Con bạn có tiến bộ như mong đợi không?', type: 'choice', category: 'curriculum', options: ['Vượt mong đợi', 'Đúng mong đợi', 'Chưa đạt mong đợi'], required: true, order: 3 },
      { id: 'recommend', question: 'Bạn có giới thiệu trung tâm cho người khác không?', type: 'choice', category: 'general', options: ['Chắc chắn có', 'Có thể', 'Không'], required: true, order: 4 },
      { id: 'continue', question: 'Bạn có muốn tiếp tục đăng ký khóa tiếp theo?', type: 'choice', category: 'general', options: ['Có', 'Đang cân nhắc', 'Không'], required: true, order: 5 },
      { id: 'feedback', question: 'Góp ý để chúng tôi cải thiện', type: 'text', category: 'general', required: false, order: 6 },
    ],
    isDefault: false,
    status: 'active',
  },
  {
    name: 'Khảo sát nhanh hàng tháng',
    description: 'Form khảo sát ngắn gọn hàng tháng',
    questions: [
      { id: 'satisfaction', question: 'Mức độ hài lòng tổng thể tháng này', type: 'score', category: 'general', required: true, order: 1 },
      { id: 'issue', question: 'Có vấn đề gì cần phản ánh không?', type: 'text', category: 'general', required: false, order: 2 },
    ],
    isDefault: false,
    status: 'active',
  },
];

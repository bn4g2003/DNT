/**
 * Feedback Types
 * Types cho hệ thống khảo sát phản hồi
 */

// Câu hỏi trong form khảo sát
export interface FeedbackQuestion {
    id: string;
    question: string;
    type: 'score' | 'text' | 'choice';
    category?: 'teacher' | 'curriculum' | 'care' | 'facilities' | 'other';
    options?: string[];  // Cho type = 'choice'
    required?: boolean;
}

// Chiến dịch khảo sát (template)
export interface FeedbackCampaign {
    id: string;
    name: string;              // "Khảo sát T12/2024"
    description?: string;
    questions: FeedbackQuestion[];
    targetType: 'all_students' | 'specific_classes' | 'specific_students';
    targetClassIds?: string[];
    targetStudentIds?: string[];
    status: 'draft' | 'active' | 'closed';
    startDate?: string;
    endDate?: string;
    createdAt: string;
    createdBy?: string;
}

// Token cho từng học viên điền form
export interface FeedbackToken {
    id: string;
    campaignId: string;
    studentId: string;
    studentName: string;
    classId?: string;
    className?: string;
    token: string;           // Unique token dùng trong URL
    status: 'pending' | 'submitted';
    createdAt: string;
    expiresAt?: string;
}

// Bản ghi phản hồi (khi học viên/phụ huynh điền)
export interface FeedbackSubmission {
    id: string;
    campaignId: string;
    campaignName: string;
    tokenId: string;
    studentId: string;
    studentName: string;
    classId?: string;
    className?: string;

    // Điểm theo category (backwards compatible với FeedbackRecord cũ)
    teacherScore?: number;      // 1-10
    curriculumScore?: number;
    careScore?: number;
    facilitiesScore?: number;
    averageScore?: number;

    // Chi tiết câu trả lời
    answers: Record<string, string | number>;  // {questionId: answer}

    comments?: string;
    submittedAt: string;
    submittedBy: 'student' | 'parent';
    submitterName?: string;
    submitterPhone?: string;
}

// Default questions cho form khảo sát tiêu chuẩn
export const DEFAULT_FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
    {
        id: 'teacher',
        question: 'Bạn đánh giá thế nào về giáo viên?',
        type: 'score',
        category: 'teacher',
        required: true
    },
    {
        id: 'curriculum',
        question: 'Bạn đánh giá thế nào về chương trình học / tiến bộ?',
        type: 'score',
        category: 'curriculum',
        required: true
    },
    {
        id: 'care',
        question: 'Bạn đánh giá thế nào về dịch vụ chăm sóc?',
        type: 'score',
        category: 'care',
        required: true
    },
    {
        id: 'facilities',
        question: 'Bạn đánh giá thế nào về cơ sở vật chất?',
        type: 'score',
        category: 'facilities',
        required: true
    },
    {
        id: 'comments',
        question: 'Ý kiến đóng góp khác',
        type: 'text',
        category: 'other',
        required: false
    }
];

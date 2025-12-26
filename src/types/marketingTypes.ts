/**
 * Marketing Types
 * Types cho quản lý chiến lược Marketing
 */

// Task Marketing
export type MarketingTaskStatus = 'Chưa bắt đầu' | 'Đang làm' | 'Hoàn thành' | 'Hủy';
export type MarketingTaskPriority = 'Thấp' | 'Trung bình' | 'Cao';

export interface MarketingTask {
    id?: string;
    title: string;
    description: string;
    assignedTo: string[];       // Staff IDs
    assignedToNames: string[];  // Staff names (denormalized)
    campaignId?: string;
    campaignName?: string;
    status: MarketingTaskStatus;
    priority: MarketingTaskPriority;
    dueDate: string;
    completedDate?: string;
    result?: string;            // Kết quả chi tiết
    completionPercent: number;  // 0-100
    notes?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

// Marketing KPI
export interface MarketingKpi {
    id?: string;
    staffId: string;
    staffName: string;
    month: string;              // "2024-12"
    targetName: string;         // Tên mục tiêu
    targetValue: number;        // Giá trị mục tiêu
    actualValue: number;        // Giá trị thực tế
    weight: number;             // Tỷ trọng (%) 0-100
    unit?: string;              // Đơn vị (leads, contracts, ...)
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Marketing Platform
export interface MarketingPlatform {
    id?: string;
    name: string;               // Facebook, Zalo, TikTok, Website, Google...
    icon?: string;
    color?: string;             // Màu hiển thị
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Platform Monthly Stats
export interface PlatformMonthlyStats {
    id?: string;
    platformId: string;
    platformName: string;
    month: string;              // "2024-12"
    newFollowers: number;       // Lượt theo dõi mới
    interactions: number;       // Lượt tương tác
    newMessages: number;        // Tin nhắn mới
    reach?: number;             // Lượt tiếp cận
    clicks?: number;            // Lượt click
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Staff Performance Summary
export interface StaffPerformance {
    staffId: string;
    staffName: string;
    month: string;
    taskCompletionPercent: number;  // % công việc hoàn thành
    kpiCompletionPercent: number;   // % mục tiêu hoàn thành
    overallPercent: number;         // (task + kpi) / 2
}

import React, { useState } from 'react';
import { CalendarCheck, Settings, Award, FileText, User } from 'lucide-react';
import { WorkConfirmation } from './WorkConfirmation';
import { SalaryManager } from './SalaryManager';
import { StaffRewardPenalty } from './StaffRewardPenalty';
import { SalaryReportTeacher } from './SalaryReportTeacher';
import { SalaryReportStaff } from './SalaryReportStaff';

export const PayrollHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'work' | 'config' | 'rewards' | 'report-teacher' | 'report-staff'>('work');

    const tabs = [
        { id: 'work', label: 'Chấm công GV/TG', icon: CalendarCheck },
        { id: 'config', label: 'Cấu hình Lương', icon: Settings },
        { id: 'rewards', label: 'Thưởng / Phạt', icon: Award },
        { id: 'report-teacher', label: 'Báo cáo Lương GV', icon: User },
        { id: 'report-staff', label: 'Báo cáo Lương NV', icon: FileText },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-2">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'work' && <WorkConfirmation />}
                {activeTab === 'config' && <SalaryManager />}
                {activeTab === 'rewards' && <StaffRewardPenalty />}
                {activeTab === 'report-teacher' && <SalaryReportTeacher />}
                {activeTab === 'report-staff' && <SalaryReportStaff />}
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Calendar, CheckSquare, Coffee, BookOpen, Clock } from 'lucide-react';
import { Schedule } from './Schedule';
import { Attendance } from './Attendance';
import { HolidayManager } from './HolidayManager';
import { TutoringManager } from './TutoringManager';
import { HomeworkManager } from './HomeworkManager';

export const AcademicHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'schedule' | 'attendance' | 'holidays' | 'tutoring' | 'homework'>('schedule');

    const tabs = [
        { id: 'schedule', label: 'Thời khóa biểu', icon: Calendar },
        { id: 'attendance', label: 'Điểm danh', icon: CheckSquare },
        { id: 'holidays', label: 'Lịch nghỉ', icon: Coffee },
        { id: 'tutoring', label: 'Lịch bồi', icon: Clock },
        { id: 'homework', label: 'Bài tập', icon: BookOpen },
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
                {activeTab === 'schedule' && <Schedule />}
                {activeTab === 'attendance' && <Attendance />}
                {activeTab === 'holidays' && <HolidayManager />}
                {activeTab === 'tutoring' && <TutoringManager />}
                {activeTab === 'homework' && <HomeworkManager />}
            </div>
        </div>
    );
};

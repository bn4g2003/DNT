import React, { useState } from 'react';
import { BarChart2, CheckSquare, Target } from 'lucide-react';
import { TeacherDetailReport } from './TeacherDetailReport';
import { TeacherTaskManager } from './TeacherTaskManager';
import { TeacherGoalManager } from './TeacherGoalManager';

export const TeacherHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'report' | 'tasks' | 'goals'>('report');

    const tabs = [
        { id: 'report', label: 'Báo cáo Hiệu suất', icon: BarChart2 },
        { id: 'tasks', label: 'Quản lý Công việc', icon: CheckSquare },
        { id: 'goals', label: 'Mục tiêu (KPI)', icon: Target },
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
                {activeTab === 'report' && <TeacherDetailReport />}
                {activeTab === 'tasks' && <TeacherTaskManager />}
                {activeTab === 'goals' && <TeacherGoalManager />}
            </div>
        </div>
    );
};

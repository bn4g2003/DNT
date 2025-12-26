import React, { useState } from 'react';
import { BookOpen, DollarSign, GraduationCap } from 'lucide-react';
import { TrainingReport } from './TrainingReport';
import { RevenueReport } from './RevenueReport';
import { MonthlyReport } from './MonthlyReport';

export const ReportHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'training' | 'finance' | 'monthly'>('training');

    const tabs = [
        { id: 'training', label: 'Báo cáo Đào tạo', icon: BookOpen },
        { id: 'finance', label: 'Báo cáo Tài chính', icon: DollarSign },
        { id: 'monthly', label: 'Báo cáo Học tập', icon: GraduationCap },
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
                {activeTab === 'training' && <TrainingReport />}
                {activeTab === 'finance' && <RevenueReport />}
                {activeTab === 'monthly' && <MonthlyReport />}
            </div>
        </div>
    );
};

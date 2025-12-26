import React, { useState } from 'react';
import { LayoutDashboard, MessageSquare, ClipboardList } from 'lucide-react';
import { CustomerServiceDashboard } from './CustomerServiceDashboard';
import { FeedbackManager } from './FeedbackManager';
import { SurveyManager } from './SurveyManager';

export const ServiceHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'feedback' | 'surveys'>('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard CSKH', icon: LayoutDashboard },
        { id: 'feedback', label: 'Phản hồi', icon: MessageSquare },
        { id: 'surveys', label: 'Khảo sát', icon: ClipboardList },
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
                {activeTab === 'dashboard' && <CustomerServiceDashboard />}
                {activeTab === 'feedback' && <FeedbackManager />}
                {activeTab === 'surveys' && <SurveyManager />}
            </div>
        </div>
    );
};

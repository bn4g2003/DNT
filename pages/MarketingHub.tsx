import React, { useState } from 'react';
import { Database, Megaphone, CheckSquare, Target, PieChart } from 'lucide-react';
import { CustomerDatabase } from './CustomerDatabase';
import { CampaignManager } from './CampaignManager';
import { MarketingTaskManager } from './MarketingTaskManager';
import { MarketingKpiManager } from './MarketingKpiManager';
import { MarketingPlatformStats } from './MarketingPlatformStats';

export const MarketingHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'leads' | 'campaigns' | 'tasks' | 'kpi' | 'stats'>('leads');

    const tabs = [
        { id: 'leads', label: 'Kho dữ liệu KH', icon: Database },
        { id: 'campaigns', label: 'Chiến dịch', icon: Megaphone },
        { id: 'tasks', label: 'Quản lý Task', icon: CheckSquare },
        { id: 'kpi', label: 'Mục tiêu KPI', icon: Target },
        { id: 'stats', label: 'Thống kê', icon: PieChart },
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
                {activeTab === 'leads' && <CustomerDatabase />}
                {activeTab === 'campaigns' && <CampaignManager />}
                {activeTab === 'tasks' && <MarketingTaskManager />}
                {activeTab === 'kpi' && <MarketingKpiManager />}
                {activeTab === 'stats' && <MarketingPlatformStats />}
            </div>
        </div>
    );
};

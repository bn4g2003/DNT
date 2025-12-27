import React, { useState } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, Box, Users, Database } from 'lucide-react';
import { FinancialDashboard } from './FinancialDashboard';
import { CashflowReport } from './CashflowReport';
import { NetProfitReport } from './NetProfitReport';
import { AssetManager } from './AssetManager';
import { TeacherDebtTracker } from './TeacherDebtTracker';

export const FinancialAnalyticsHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'cashflow' | 'profit' | 'assets' | 'debt'>('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'cashflow', label: 'Dòng tiền', icon: Wallet },
        { id: 'profit', label: 'Lợi nhuận', icon: TrendingUp },
        { id: 'assets', label: 'Tài sản', icon: Box },
        { id: 'debt', label: 'Công nợ GV', icon: Users },
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Phân tích Tài chính</h1>
            </div>

            <div className="flex gap-2 border-b mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600 font-medium'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                {activeTab === 'dashboard' && <FinancialDashboard />}
                {activeTab === 'cashflow' && <CashflowReport />}
                {activeTab === 'profit' && <NetProfitReport />}
                {activeTab === 'assets' && <AssetManager />}
                {activeTab === 'debt' && <TeacherDebtTracker />}
            </div>
        </div>
    );
};

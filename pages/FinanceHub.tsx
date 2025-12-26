import React, { useState } from 'react';
import { FileText, DollarSign, CreditCard, PieChart } from 'lucide-react';
import { ContractList } from './ContractList';
import { InvoiceManager } from './InvoiceManager';
import { DebtManagement } from './DebtManagement';
import { RevenueReport } from './RevenueReport';

export const FinanceHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'contracts' | 'invoices' | 'debt' | 'revenue'>('contracts');

    const tabs = [
        { id: 'contracts', label: 'Quản lý hợp đồng', icon: FileText },
        { id: 'invoices', label: 'Hóa đơn', icon: DollarSign },
        { id: 'debt', label: 'Công nợ', icon: CreditCard },
        { id: 'revenue', label: 'Doanh thu', icon: PieChart },
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
                {activeTab === 'contracts' && <ContractList />}
                {activeTab === 'invoices' && <InvoiceManager />}
                {activeTab === 'debt' && <DebtManagement />}
                {activeTab === 'revenue' && <RevenueReport />}
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Building2, Box, Layers, Package, LayoutGrid } from 'lucide-react';
import { CenterSettings } from './CenterSettings';
import { RoomManager } from './RoomManager';
import { CurriculumManager } from './CurriculumManager';
import { InventoryManager } from './InventoryManager';
import { ProductManager } from './ProductManager';
import { usePermissions } from '../src/hooks/usePermissions';

export const ConfigurationHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'center' | 'rooms' | 'curriculum' | 'inventory' | 'products'>('center');
    const { canView } = usePermissions();

    const tabs = [
        { id: 'center', label: 'Quản lý cơ sở', icon: Building2 },
        { id: 'rooms', label: 'Quản lý phòng học', icon: LayoutGrid },
        { id: 'curriculum', label: 'Quản lý Gói học', icon: Layers },
        { id: 'products', label: 'Quản lý vật phẩm', icon: Box },
        { id: 'inventory', label: 'Quản lý kho', icon: Package },
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
                {activeTab === 'center' && <CenterSettings />}
                {activeTab === 'rooms' && <RoomManager />}
                {activeTab === 'curriculum' && <CurriculumManager />}
                {activeTab === 'products' && <ProductManager />}
                {activeTab === 'inventory' && <InventoryManager />}
            </div>
        </div>
    );
};

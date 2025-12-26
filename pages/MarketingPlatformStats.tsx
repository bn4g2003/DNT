/**
 * Marketing Platform Stats Page
 * Theo dõi chỉ số Marketing trên từng nền tảng
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart3, Plus, Edit, Trash2, X, Calendar, TrendingUp,
    MessageCircle, Users, MousePointer, Globe
} from 'lucide-react';
import { useMarketingPlatforms, usePlatformStats } from '../src/hooks/useMarketingPlatforms';
import { MarketingPlatform, PlatformMonthlyStats } from '../src/types/marketingTypes';

export const MarketingPlatformStats: React.FC = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const { platforms, loading: platformLoading, createPlatform, updatePlatform, deletePlatform } = useMarketingPlatforms();
    const { stats, loading: statsLoading, createStats, updateStats, refetch: refetchStats } = usePlatformStats(selectedMonth);

    const [showPlatformModal, setShowPlatformModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<MarketingPlatform | null>(null);
    const [editingStats, setEditingStats] = useState<{ platform: MarketingPlatform; stats?: PlatformMonthlyStats } | null>(null);

    // Combine platforms with stats
    const platformsWithStats = useMemo(() => {
        return platforms.filter(p => p.isActive).map(platform => {
            const platformStats = stats.find(s => s.platformId === platform.id);
            return {
                platform,
                stats: platformStats || null,
            };
        });
    }, [platforms, stats]);

    // Summary
    const summary = useMemo(() => {
        return {
            totalFollowers: stats.reduce((sum, s) => sum + (s.newFollowers || 0), 0),
            totalInteractions: stats.reduce((sum, s) => sum + (s.interactions || 0), 0),
            totalMessages: stats.reduce((sum, s) => sum + (s.newMessages || 0), 0),
        };
    }, [stats]);

    const handleDeletePlatform = async (id: string) => {
        if (!confirm('Xóa nền tảng này?')) return;
        try {
            await deletePlatform(id);
        } catch (err) {
            alert('Không thể xóa');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <BarChart3 className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Thống kê Nền tảng Marketing</h2>
                            <p className="text-sm text-gray-500">Theo dõi chỉ số trên từng kênh tiếp thị</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-gray-400" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <button
                            onClick={() => { setEditingPlatform(null); setShowPlatformModal(true); }}
                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
                        >
                            <Plus size={16} /> Thêm nền tảng
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                    icon={<Users size={20} />}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    label="Lượt theo dõi mới"
                    value={summary.totalFollowers.toLocaleString()}
                />
                <SummaryCard
                    icon={<TrendingUp size={20} />}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    label="Lượt tương tác"
                    value={summary.totalInteractions.toLocaleString()}
                />
                <SummaryCard
                    icon={<MessageCircle size={20} />}
                    iconBg="bg-orange-100"
                    iconColor="text-orange-600"
                    label="Tin nhắn mới"
                    value={summary.totalMessages.toLocaleString()}
                />
            </div>

            {/* Platform Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformLoading || statsLoading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Đang tải...</div>
                ) : platformsWithStats.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400">
                        <Globe size={48} className="mx-auto mb-2 opacity-20" />
                        Chưa có nền tảng nào
                    </div>
                ) : platformsWithStats.map(({ platform, stats: platformStats }) => (
                    <div key={platform.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div
                            className="px-4 py-3 border-b border-gray-100 flex items-center justify-between"
                            style={{ backgroundColor: platform.color ? `${platform.color}15` : '#f3f4f6' }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{platform.icon || '🌐'}</span>
                                <span className="font-semibold text-gray-800">{platform.name}</span>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => { setEditingStats({ platform, stats: platformStats || undefined }); setShowStatsModal(true); }}
                                    className="p-1 text-gray-400 hover:text-purple-600" title="Cập nhật số liệu"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => { setEditingPlatform(platform); setShowPlatformModal(true); }}
                                    className="p-1 text-gray-400 hover:text-blue-600" title="Sửa nền tảng"
                                >
                                    <Globe size={16} />
                                </button>
                                <button
                                    onClick={() => platform.id && handleDeletePlatform(platform.id)}
                                    className="p-1 text-gray-400 hover:text-red-600" title="Xóa"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <StatRow icon={<Users size={16} />} label="Theo dõi mới" value={platformStats?.newFollowers || 0} color="text-blue-600" />
                            <StatRow icon={<TrendingUp size={16} />} label="Tương tác" value={platformStats?.interactions || 0} color="text-green-600" />
                            <StatRow icon={<MessageCircle size={16} />} label="Tin nhắn" value={platformStats?.newMessages || 0} color="text-orange-600" />
                            {platformStats?.reach !== undefined && (
                                <StatRow icon={<Globe size={16} />} label="Tiếp cận" value={platformStats.reach} color="text-purple-600" />
                            )}
                            {platformStats?.clicks !== undefined && (
                                <StatRow icon={<MousePointer size={16} />} label="Click" value={platformStats.clicks} color="text-indigo-600" />
                            )}
                            {!platformStats && (
                                <p className="text-xs text-gray-400 text-center py-2">Chưa có số liệu tháng này</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Platform Modal */}
            {showPlatformModal && (
                <PlatformModal
                    platform={editingPlatform}
                    onClose={() => { setShowPlatformModal(false); setEditingPlatform(null); }}
                    onSubmit={async (data) => {
                        if (editingPlatform?.id) {
                            await updatePlatform(editingPlatform.id, data);
                        } else {
                            await createPlatform(data as any);
                        }
                        setShowPlatformModal(false);
                        setEditingPlatform(null);
                    }}
                />
            )}

            {/* Stats Modal */}
            {showStatsModal && editingStats && (
                <StatsModal
                    platform={editingStats.platform}
                    stats={editingStats.stats}
                    month={selectedMonth}
                    onClose={() => { setShowStatsModal(false); setEditingStats(null); }}
                    onSubmit={async (data) => {
                        if (editingStats.stats?.id) {
                            await updateStats(editingStats.stats.id, data);
                        } else {
                            await createStats({
                                ...data,
                                platformId: editingStats.platform.id || '',
                                platformName: editingStats.platform.name,
                                month: selectedMonth,
                            } as any);
                        }
                        setShowStatsModal(false);
                        setEditingStats(null);
                        refetchStats();
                    }}
                />
            )}
        </div>
    );
};

// Summary Card
const SummaryCard: React.FC<{ icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: string }> =
    ({ icon, iconBg, iconColor, label, value }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
                <div className={`${iconBg} p-2 rounded-lg ${iconColor}`}>{icon}</div>
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );

// Stat Row
const StatRow: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> =
    ({ icon, label, value, color }) => (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
                {icon}
                <span className="text-sm">{label}</span>
            </div>
            <span className={`font-bold ${color}`}>{value.toLocaleString()}</span>
        </div>
    );

// Platform Modal
interface PlatformModalProps {
    platform?: MarketingPlatform | null;
    onClose: () => void;
    onSubmit: (data: Partial<MarketingPlatform>) => Promise<void>;
}

const PlatformModal: React.FC<PlatformModalProps> = ({ platform, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: platform?.name || '',
        icon: platform?.icon || '🌐',
        color: platform?.color || '#6366F1',
        isActive: platform?.isActive ?? true,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Vui lòng nhập tên nền tảng');
            return;
        }
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">{platform ? 'Sửa nền tảng' : 'Thêm nền tảng mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên nền tảng <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="VD: Facebook, Zalo, TikTok..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                            <input type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-2xl text-center" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                            <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}
                                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Stats Modal
interface StatsModalProps {
    platform: MarketingPlatform;
    stats?: PlatformMonthlyStats;
    month: string;
    onClose: () => void;
    onSubmit: (data: Partial<PlatformMonthlyStats>) => Promise<void>;
}

const StatsModal: React.FC<StatsModalProps> = ({ platform, stats, month, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        newFollowers: stats?.newFollowers || 0,
        interactions: stats?.interactions || 0,
        newMessages: stats?.newMessages || 0,
        reach: stats?.reach || 0,
        clicks: stats?.clicks || 0,
        notes: stats?.notes || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span>{platform.icon}</span> {platform.name}
                        </h3>
                        <p className="text-sm text-gray-500">Cập nhật số liệu tháng {month}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Theo dõi mới</label>
                            <input type="number" min={0} value={formData.newFollowers} onChange={e => setFormData({ ...formData, newFollowers: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tương tác</label>
                            <input type="number" min={0} value={formData.interactions} onChange={e => setFormData({ ...formData, interactions: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tin nhắn</label>
                            <input type="number" min={0} value={formData.newMessages} onChange={e => setFormData({ ...formData, newMessages: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiếp cận</label>
                            <input type="number" min={0} value={formData.reach} onChange={e => setFormData({ ...formData, reach: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Click</label>
                            <input type="number" min={0} value={formData.clicks} onChange={e => setFormData({ ...formData, clicks: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                        <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Marketing KPI Manager Page
 * Quản lý mục tiêu KPI nhân viên Marketing
 */

import React, { useState, useMemo } from 'react';
import {
    Target, Plus, Edit, Trash2, X, TrendingUp, Users,
    Calendar, Award
} from 'lucide-react';
import { useMarketingKpis } from '../src/hooks/useMarketingKpis';
import { useMarketingTasks } from '../src/hooks/useMarketingTasks';
import { useStaff } from '../src/hooks/useStaff';
import { MarketingKpi } from '../src/types/marketingTypes';

export const MarketingKpiManager: React.FC = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const { kpis, loading, error, createKpi, updateKpi, deleteKpi, calculateKpiPercent, getStaffKpiCompletion, getOverallPerformance } = useMarketingKpis({ month: selectedMonth });
    const { tasks, getStaffCompletion } = useMarketingTasks();
    const { staff = [] } = useStaff();

    const [showModal, setShowModal] = useState(false);
    const [editingKpi, setEditingKpi] = useState<MarketingKpi | null>(null);

    const marketingStaff = staff.filter(s =>
        s.position === 'Sale' || s.department === 'Kinh doanh' || s.role === 'Sale'
    );

    // Group KPIs by staff
    const kpisByStaff = useMemo(() => {
        const grouped: Record<string, { staff: any; kpis: MarketingKpi[] }> = {};
        marketingStaff.forEach(s => {
            grouped[s.id || ''] = { staff: s, kpis: [] };
        });
        kpis.forEach(kpi => {
            if (grouped[kpi.staffId]) {
                grouped[kpi.staffId].kpis.push(kpi);
            }
        });
        return Object.values(grouped).filter(g => g.kpis.length > 0 || marketingStaff.some(s => s.id === g.staff.id));
    }, [kpis, marketingStaff]);

    // Staff performance summary
    const staffPerformance = useMemo(() => {
        return marketingStaff.map(s => {
            const taskPercent = getStaffCompletion(s.id || '');
            const kpiPercent = getStaffKpiCompletion(s.id || '');
            const overall = getOverallPerformance(taskPercent, kpiPercent);
            return {
                id: s.id,
                name: s.name,
                taskPercent,
                kpiPercent,
                overall,
            };
        });
    }, [marketingStaff, getStaffCompletion, getStaffKpiCompletion, getOverallPerformance]);

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa mục tiêu KPI này?')) return;
        try {
            await deleteKpi(id);
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
                        <div className="bg-green-100 p-2 rounded-lg">
                            <Target className="text-green-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Quản lý KPI Marketing</h2>
                            <p className="text-sm text-gray-500">Thiết lập mục tiêu và theo dõi kết quả nhân viên</p>
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
                            onClick={() => { setEditingKpi(null); setShowModal(true); }}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                            <Plus size={16} /> Thêm KPI
                        </button>
                    </div>
                </div>
            </div>

            {/* Staff Performance Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Award size={20} className="text-green-600" />
                    Tổng kết kết quả nhân viên - Tháng {selectedMonth}
                </h3>
                <div className="text-sm text-gray-500 mb-4">
                    Công thức: <strong>Kết quả = (% Công việc + % Mục tiêu) / 2</strong>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-green-50 text-xs uppercase font-semibold text-gray-600">
                            <tr>
                                <th className="px-4 py-3">Nhân viên</th>
                                <th className="px-4 py-3 text-center">% Công việc (Task)</th>
                                <th className="px-4 py-3 text-center">% Mục tiêu (KPI)</th>
                                <th className="px-4 py-3 text-center">Kết quả (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {staffPerformance.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có nhân viên Sale/Marketing</td></tr>
                            ) : staffPerformance.map(sp => (
                                <tr key={sp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{sp.name}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sp.taskPercent}%` }} />
                                            </div>
                                            <span className="font-medium text-blue-600">{sp.taskPercent}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${sp.kpiPercent}%` }} />
                                            </div>
                                            <span className="font-medium text-green-600">{sp.kpiPercent}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${sp.overall >= 80 ? 'bg-green-100 text-green-700' :
                                                sp.overall >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {sp.overall}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* KPI Details by Staff */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">Đang tải...</div>
                ) : error ? (
                    <div className="bg-white rounded-xl p-8 text-center text-red-500">{error}</div>
                ) : kpisByStaff.map(({ staff: s, kpis: staffKpis }) => (
                    <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-green-600" />
                                    <span className="font-semibold text-gray-800">{s.name}</span>
                                    <span className="text-xs text-gray-500">({s.position})</span>
                                </div>
                                <span className="text-sm font-bold text-green-600">
                                    KPI: {getStaffKpiCompletion(s.id || '')}%
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            {staffKpis.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">Chưa có mục tiêu KPI</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-500 border-b">
                                        <tr>
                                            <th className="text-left py-2">Mục tiêu</th>
                                            <th className="text-center py-2">Chỉ tiêu</th>
                                            <th className="text-center py-2">Thực tế</th>
                                            <th className="text-center py-2">Tỷ trọng</th>
                                            <th className="text-center py-2">% Đạt</th>
                                            <th className="text-center py-2">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {staffKpis.map(kpi => {
                                            const percent = calculateKpiPercent(kpi);
                                            return (
                                                <tr key={kpi.id} className="hover:bg-gray-50">
                                                    <td className="py-2">
                                                        <span className="font-medium text-gray-800">{kpi.targetName}</span>
                                                        {kpi.notes && <p className="text-xs text-gray-400">{kpi.notes}</p>}
                                                    </td>
                                                    <td className="py-2 text-center">{kpi.targetValue} {kpi.unit}</td>
                                                    <td className="py-2 text-center font-medium text-gray-800">{kpi.actualValue} {kpi.unit}</td>
                                                    <td className="py-2 text-center text-gray-600">{kpi.weight}%</td>
                                                    <td className="py-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${percent >= 100 ? 'bg-green-100 text-green-700' :
                                                                percent >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            {percent}%
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-center">
                                                        <button onClick={() => { setEditingKpi(kpi); setShowModal(true); }} className="p-1 text-gray-400 hover:text-green-600">
                                                            <Edit size={14} />
                                                        </button>
                                                        <button onClick={() => kpi.id && handleDelete(kpi.id)} className="p-1 text-gray-400 hover:text-red-600">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <KpiModal
                    kpi={editingKpi}
                    staff={marketingStaff}
                    selectedMonth={selectedMonth}
                    onClose={() => { setShowModal(false); setEditingKpi(null); }}
                    onSubmit={async (data) => {
                        if (editingKpi?.id) {
                            await updateKpi(editingKpi.id, data);
                        } else {
                            await createKpi(data as any);
                        }
                        setShowModal(false);
                        setEditingKpi(null);
                    }}
                />
            )}
        </div>
    );
};

// KPI Modal
interface KpiModalProps {
    kpi?: MarketingKpi | null;
    staff: any[];
    selectedMonth: string;
    onClose: () => void;
    onSubmit: (data: Partial<MarketingKpi>) => Promise<void>;
}

const KpiModal: React.FC<KpiModalProps> = ({ kpi, staff, selectedMonth, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        staffId: kpi?.staffId || '',
        staffName: kpi?.staffName || '',
        month: kpi?.month || selectedMonth,
        targetName: kpi?.targetName || '',
        targetValue: kpi?.targetValue || 0,
        actualValue: kpi?.actualValue || 0,
        weight: kpi?.weight || 100,
        unit: kpi?.unit || '',
        notes: kpi?.notes || '',
    });
    const [loading, setLoading] = useState(false);

    const handleStaffChange = (staffId: string) => {
        const selectedStaff = staff.find(s => s.id === staffId);
        setFormData({
            ...formData,
            staffId,
            staffName: selectedStaff?.name || '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.staffId || !formData.targetName || formData.targetValue <= 0) {
            alert('Vui lòng điền đầy đủ thông tin');
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
                    <h3 className="text-xl font-bold text-gray-800">{kpi ? 'Sửa KPI' : 'Thêm KPI mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên <span className="text-red-500">*</span></label>
                        <select value={formData.staffId} onChange={e => handleStaffChange(e.target.value)} required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            <option value="">-- Chọn nhân viên --</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên mục tiêu <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.targetName} onChange={e => setFormData({ ...formData, targetName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="VD: Số lead mới, Số hợp đồng..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chỉ tiêu <span className="text-red-500">*</span></label>
                            <input type="number" min={1} required value={formData.targetValue} onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thực tế</label>
                            <input type="number" min={0} value={formData.actualValue} onChange={e => setFormData({ ...formData, actualValue: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ trọng (%)</label>
                            <input type="number" min={1} max={100} value={formData.weight} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                            <input type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="leads, HĐ, ..." />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                        <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Department Goal Manager Page
 * Cấu hình mục tiêu tháng theo phòng ban (ERS)
 */

import React, { useState, useMemo } from 'react';
import {
    Target, Plus, Edit, Trash2, X, TrendingUp, Building2,
    Calendar, ChevronRight, BarChart3
} from 'lucide-react';
import { useDepartmentGoals } from '../src/hooks/useDepartmentGoals';
import { DepartmentGoal, DepartmentCode, DEPARTMENT_LABELS } from '../types';

const DEPARTMENT_COLORS: Record<DepartmentCode, { bg: string; text: string; border: string }> = {
    sales: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    training: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    marketing: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    accounting: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    hr: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' }
};

export const DepartmentGoalManager: React.FC = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedDept, setSelectedDept] = useState<DepartmentCode | 'all'>('all');

    const {
        goals,
        loading,
        error,
        createGoal,
        updateGoal,
        deleteGoal,
        getDepartmentResult,
        getGoalsByDepartment
    } = useDepartmentGoals({ month: selectedMonth, year: selectedYear });

    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<DepartmentGoal | null>(null);

    // Filter goals by department
    const filteredGoals = useMemo(() => {
        if (selectedDept === 'all') return goals;
        return goals.filter(g => g.departmentCode === selectedDept);
    }, [goals, selectedDept]);

    // Group goals by department
    const goalsByDept = useMemo(() => getGoalsByDepartment(), [getGoalsByDepartment]);

    // Departments to show
    const departments = useMemo(() => {
        if (selectedDept === 'all') {
            return Object.keys(DEPARTMENT_LABELS) as DepartmentCode[];
        }
        return [selectedDept];
    }, [selectedDept]);

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa mục tiêu này?')) return;
        try {
            await deleteGoal(id);
        } catch (err) {
            alert('Không thể xóa mục tiêu');
        }
    };

    const getResultColor = (result: number) => {
        if (result >= 100) return 'bg-green-100 text-green-700';
        if (result >= 85) return 'bg-blue-100 text-blue-700';
        if (result >= 70) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <Target className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Mục tiêu KPI theo Phòng ban</h2>
                            <p className="text-sm text-gray-500">Thiết lập và theo dõi mục tiêu tháng cho từng phòng ban</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-gray-400" />
                            <select
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={e => setSelectedYear(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => { setEditingGoal(null); setShowModal(true); }}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                        >
                            <Plus size={16} /> Thêm mục tiêu
                        </button>
                    </div>
                </div>
            </div>

            {/* Department Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedDept('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDept === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Tất cả
                    </button>
                    {(Object.keys(DEPARTMENT_LABELS) as DepartmentCode[]).map(code => (
                        <button
                            key={code}
                            onClick={() => setSelectedDept(code)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDept === code
                                    ? `${DEPARTMENT_COLORS[code].bg} ${DEPARTMENT_COLORS[code].text}`
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {DEPARTMENT_LABELS[code]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Department Results Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(Object.keys(DEPARTMENT_LABELS) as DepartmentCode[]).map(code => {
                    const result = getDepartmentResult(code);
                    const colors = DEPARTMENT_COLORS[code];
                    return (
                        <div
                            key={code}
                            className={`${colors.bg} ${colors.border} border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow`}
                            onClick={() => setSelectedDept(code)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Building2 size={20} className={colors.text} />
                                <span className={`text-2xl font-bold ${colors.text}`}>{result}%</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700">{DEPARTMENT_LABELS[code]}</p>
                            <p className="text-xs text-gray-500">{goalsByDept[code]?.length || 0} mục tiêu</p>
                        </div>
                    );
                })}
            </div>

            {/* Goals by Department */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">Đang tải...</div>
                ) : error ? (
                    <div className="bg-white rounded-xl p-8 text-center text-red-500">{error}</div>
                ) : departments.map(deptCode => {
                    const deptGoals = goalsByDept[deptCode] || [];
                    const result = getDepartmentResult(deptCode);
                    const colors = DEPARTMENT_COLORS[deptCode];

                    return (
                        <div key={deptCode} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Department Header */}
                            <div className={`${colors.bg} px-4 py-3 border-b ${colors.border}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 size={20} className={colors.text} />
                                        <span className="font-bold text-gray-800">{DEPARTMENT_LABELS[deptCode]}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">Kết quả:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getResultColor(result)}`}>
                                            {result}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Goals Table */}
                            <div className="p-4">
                                {deptGoals.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Target size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>Chưa có mục tiêu nào</p>
                                        <button
                                            onClick={() => { setEditingGoal(null); setShowModal(true); }}
                                            className="mt-2 text-indigo-600 hover:underline text-sm"
                                        >
                                            + Thêm mục tiêu mới
                                        </button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-gray-500 border-b bg-gray-50">
                                                <tr>
                                                    <th className="text-left py-3 px-4">Mục tiêu</th>
                                                    <th className="text-center py-3 px-4">KPI</th>
                                                    <th className="text-center py-3 px-4">Tỷ trọng</th>
                                                    <th className="text-center py-3 px-4">Thực tế</th>
                                                    <th className="text-center py-3 px-4">Kết quả</th>
                                                    <th className="text-center py-3 px-4">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {deptGoals.map(goal => (
                                                    <tr key={goal.id} className="hover:bg-gray-50">
                                                        <td className="py-3 px-4">
                                                            <span className="font-medium text-gray-800">{goal.title}</span>
                                                            {goal.description && (
                                                                <p className="text-xs text-gray-400 mt-0.5">{goal.description}</p>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="font-medium">{goal.kpiTarget.toLocaleString()}</span>
                                                            {goal.unit && <span className="text-gray-500 ml-1">{goal.unit}</span>}
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-gray-600">{goal.kpiWeight}%</td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="font-medium text-gray-800">{goal.kpiActual.toLocaleString()}</span>
                                                            {goal.unit && <span className="text-gray-500 ml-1">{goal.unit}</span>}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getResultColor(goal.kpiResult)}`}>
                                                                {goal.kpiResult}%
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <button
                                                                onClick={() => { setEditingGoal(goal); setShowModal(true); }}
                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(goal.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            {/* Summary Row */}
                                            <tfoot className="bg-gray-50 font-medium">
                                                <tr>
                                                    <td className="py-3 px-4 text-gray-600">Tổng cộng</td>
                                                    <td className="py-3 px-4 text-center">-</td>
                                                    <td className="py-3 px-4 text-center text-gray-800">
                                                        {deptGoals.reduce((sum, g) => sum + g.kpiWeight, 0)}%
                                                    </td>
                                                    <td className="py-3 px-4 text-center">-</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getResultColor(result)}`}>
                                                            {result}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {!loading && filteredGoals.length === 0 && selectedDept === 'all' && (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <Target size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Chưa có mục tiêu nào</h3>
                        <p className="text-gray-400 mb-4">Bắt đầu bằng việc thêm mục tiêu KPI cho các phòng ban</p>
                        <button
                            onClick={() => { setEditingGoal(null); setShowModal(true); }}
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                        >
                            <Plus size={18} /> Thêm mục tiêu đầu tiên
                        </button>
                    </div>
                )}
            </div>

            {/* Goal Modal */}
            {showModal && (
                <GoalModal
                    goal={editingGoal}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onClose={() => { setShowModal(false); setEditingGoal(null); }}
                    onSubmit={async (data) => {
                        if (editingGoal?.id) {
                            await updateGoal(editingGoal.id, data);
                        } else {
                            await createGoal(data as any);
                        }
                        setShowModal(false);
                        setEditingGoal(null);
                    }}
                />
            )}
        </div>
    );
};

// Goal Modal Component
interface GoalModalProps {
    goal?: DepartmentGoal | null;
    selectedMonth: number;
    selectedYear: number;
    onClose: () => void;
    onSubmit: (data: Partial<DepartmentGoal>) => Promise<void>;
}

const GoalModal: React.FC<GoalModalProps> = ({ goal, selectedMonth, selectedYear, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        departmentCode: goal?.departmentCode || 'sales' as DepartmentCode,
        month: goal?.month || selectedMonth,
        year: goal?.year || selectedYear,
        title: goal?.title || '',
        description: goal?.description || '',
        kpiTarget: goal?.kpiTarget || 0,
        kpiWeight: goal?.kpiWeight || 0,
        kpiActual: goal?.kpiActual || 0,
        unit: goal?.unit || '',
        status: goal?.status || 'active' as const
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || formData.kpiTarget <= 0 || formData.kpiWeight <= 0) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (err: any) {
            alert(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
                    <h3 className="text-xl font-bold text-gray-800">
                        {goal ? 'Sửa mục tiêu' : 'Thêm mục tiêu mới'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phòng ban <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.departmentCode}
                            onChange={e => setFormData({ ...formData, departmentCode: e.target.value as DepartmentCode })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            {(Object.keys(DEPARTMENT_LABELS) as DepartmentCode[]).map(code => (
                                <option key={code} value={code}>{DEPARTMENT_LABELS[code]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month/Year */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
                            <select
                                value={formData.month}
                                onChange={e => setFormData({ ...formData, month: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
                            <select
                                value={formData.year}
                                onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên mục tiêu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="VD: Doanh thu tháng, Học viên mới..."
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            rows={2}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Mô tả chi tiết mục tiêu..."
                        />
                    </div>

                    {/* KPI Target & Weight */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Chỉ tiêu KPI <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                required
                                value={formData.kpiTarget}
                                onChange={e => setFormData({ ...formData, kpiTarget: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tỷ trọng (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                required
                                value={formData.kpiWeight}
                                onChange={e => setFormData({ ...formData, kpiWeight: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Actual & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thực tế đạt được</label>
                            <input
                                type="number"
                                min={0}
                                value={formData.kpiActual}
                                onChange={e => setFormData({ ...formData, kpiActual: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="VNĐ, %, người..."
                            />
                        </div>
                    </div>

                    {/* Preview Result */}
                    {formData.kpiTarget > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">
                                Kết quả dự kiến: <strong className="text-lg">
                                    {Math.round((formData.kpiActual / formData.kpiTarget) * 100)}%
                                </strong>
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

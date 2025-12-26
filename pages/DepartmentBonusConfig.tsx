/**
 * Department Bonus Config Page
 * Cấu hình thưởng KPI theo phòng ban (ERS)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
    Award, Save, Building2, Settings, TrendingUp, DollarSign,
    Edit, X, Plus, Info, CheckCircle
} from 'lucide-react';
import { useDepartmentBonusConfig, DEFAULT_BONUS_LEVELS } from '../src/hooks/useDepartmentBonusConfig';
import { useDepartmentGoals } from '../src/hooks/useDepartmentGoals';
import { DepartmentBonusConfig as BonusConfig, DepartmentCode, DEPARTMENT_LABELS, KpiBonusLevel } from '../types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const DepartmentBonusConfig: React.FC = () => {
    const currentDate = new Date();
    const [selectedDept, setSelectedDept] = useState<DepartmentCode>('sales');
    const [isEditing, setIsEditing] = useState(false);
    const [editingLevels, setEditingLevels] = useState<KpiBonusLevel[]>([]);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const {
        configs,
        loading,
        error,
        createConfig,
        updateConfig,
        getActiveConfig,
        calculateBonus,
        DEFAULT_BONUS_LEVELS
    } = useDepartmentBonusConfig();

    const { getDepartmentResult, goals } = useDepartmentGoals({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
    });

    // Get current config for selected department
    const currentConfig = useMemo(() => getActiveConfig(selectedDept), [getActiveConfig, selectedDept]);

    // Initialize editing levels when switching departments
    useEffect(() => {
        if (currentConfig) {
            setEditingLevels([...currentConfig.levels]);
        } else {
            setEditingLevels([...DEFAULT_BONUS_LEVELS]);
        }
        setIsEditing(false);
    }, [selectedDept, currentConfig]);

    // Calculate bonus preview for all departments
    const bonusPreviews = useMemo(() => {
        return (Object.keys(DEPARTMENT_LABELS) as DepartmentCode[]).map(code => {
            const result = getDepartmentResult(code);
            const bonus = calculateBonus(code, result);
            return {
                code,
                name: DEPARTMENT_LABELS[code],
                kpiResult: result,
                bonusLevel: bonus?.level,
                bonusAmount: bonus?.amount || 0
            };
        });
    }, [getDepartmentResult, calculateBonus]);

    const handleLevelChange = (index: number, field: keyof KpiBonusLevel, value: any) => {
        const updated = [...editingLevels];
        updated[index] = { ...updated[index], [field]: value };
        setEditingLevels(updated);
    };

    const handleSave = async () => {
        try {
            const configData = {
                departmentCode: selectedDept,
                departmentName: DEPARTMENT_LABELS[selectedDept],
                levels: editingLevels,
                effectiveDate: new Date().toISOString().slice(0, 10),
                status: 'active' as const
            };

            if (currentConfig) {
                await updateConfig(currentConfig.id, { levels: editingLevels, updatedAt: new Date().toISOString() });
            } else {
                await createConfig(configData);
            }

            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            alert(err.message || 'Không thể lưu cấu hình');
        }
    };

    const handleCancel = () => {
        if (currentConfig) {
            setEditingLevels([...currentConfig.levels]);
        } else {
            setEditingLevels([...DEFAULT_BONUS_LEVELS]);
        }
        setIsEditing(false);
    };

    const getLevelColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-green-100 text-green-700 border-green-200';
            case 2: return 'bg-blue-100 text-blue-700 border-blue-200';
            case 3: return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 4: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 5: return 'bg-orange-100 text-orange-700 border-orange-200';
            case 6: return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <Award className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Cấu hình Thưởng KPI theo Phòng ban</h2>
                            <p className="text-sm text-gray-500">Thiết lập hệ số thưởng dựa trên kết quả KPI</p>
                        </div>
                    </div>
                    {saveSuccess && (
                        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                            <CheckCircle size={18} />
                            <span>Đã lưu cấu hình thành công!</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Department Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-4 mb-4">
                    <Building2 size={20} className="text-gray-400" />
                    <span className="font-medium text-gray-700">Chọn phòng ban:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(DEPARTMENT_LABELS) as DepartmentCode[]).map(code => (
                        <button
                            key={code}
                            onClick={() => setSelectedDept(code)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDept === code
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {DEPARTMENT_LABELS[code]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bonus Levels Configuration */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Settings size={20} className="text-amber-600" />
                                    <h3 className="font-bold text-gray-800">
                                        Khung Hệ số Thưởng - {DEPARTMENT_LABELS[selectedDept]}
                                    </h3>
                                </div>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 text-sm font-medium"
                                    >
                                        <Edit size={16} /> Chỉnh sửa
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                        >
                                            <X size={16} /> Hủy
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                                        >
                                            <Save size={16} /> Lưu
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Đang tải...</div>
                            ) : error ? (
                                <div className="text-center py-8 text-red-500">{error}</div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Info Note */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                                        <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700">
                                            <p className="font-medium mb-1">Hướng dẫn:</p>
                                            <ul className="list-disc list-inside space-y-1 text-blue-600">
                                                <li>Hệ số 1 dành cho kết quả xuất sắc (trên 120%)</li>
                                                <li>Hệ số 6 dành cho kết quả không đạt (dưới 60%)</li>
                                                <li>Số tiền thưởng có thể tùy chỉnh theo từng phòng ban</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Levels Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Hệ số</th>
                                                    <th className="px-4 py-3 text-center">Mức KPI</th>
                                                    <th className="px-4 py-3 text-right">Thưởng</th>
                                                    <th className="px-4 py-3 text-left">Ghi chú</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {editingLevels.map((level, index) => (
                                                    <tr key={level.level} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${getLevelColor(level.level)}`}>
                                                                {level.level}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {isEditing ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        value={level.minPercent}
                                                                        onChange={e => handleLevelChange(index, 'minPercent', Number(e.target.value))}
                                                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                                                    />
                                                                    <span>-</span>
                                                                    <input
                                                                        type="number"
                                                                        value={level.maxPercent}
                                                                        onChange={e => handleLevelChange(index, 'maxPercent', Number(e.target.value))}
                                                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                                                    />
                                                                    <span>%</span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-medium">{level.label}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    value={level.bonusAmount}
                                                                    onChange={e => handleLevelChange(index, 'bonusAmount', Number(e.target.value))}
                                                                    className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                                                                    step={100000}
                                                                />
                                                            ) : (
                                                                <span className="font-bold text-green-600">{formatCurrency(level.bonusAmount)}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={level.note || ''}
                                                                    onChange={e => handleLevelChange(index, 'note', e.target.value)}
                                                                    className="w-full px-2 py-1 border border-gray-300 rounded"
                                                                    placeholder="Ghi chú..."
                                                                />
                                                            ) : (
                                                                <span className="text-gray-500">{level.note || '-'}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Effective Date */}
                                    {currentConfig && (
                                        <div className="text-sm text-gray-500 text-right">
                                            Hiệu lực từ: {new Date(currentConfig.effectiveDate).toLocaleDateString('vi-VN')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bonus Preview */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
                            <div className="flex items-center gap-2">
                                <DollarSign size={20} className="text-green-600" />
                                <h3 className="font-bold text-gray-800">Xem trước Thưởng Tháng này</h3>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="space-y-3">
                                {bonusPreviews.map(preview => {
                                    const levelColor = preview.bonusLevel ? getLevelColor(preview.bonusLevel.level) : 'bg-gray-100 text-gray-500';
                                    return (
                                        <div
                                            key={preview.code}
                                            className={`p-4 rounded-lg border ${preview.code === selectedDept ? 'border-amber-300 bg-amber-50' : 'border-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-800">{preview.name}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${preview.kpiResult >= 100 ? 'bg-green-100 text-green-700' :
                                                        preview.kpiResult >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {preview.kpiResult}%
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {preview.bonusLevel ? (
                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${levelColor}`}>
                                                            {preview.bonusLevel.level}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Chưa cấu hình</span>
                                                    )}
                                                </div>
                                                <span className="font-bold text-green-600">
                                                    {preview.bonusAmount > 0 ? formatCurrency(preview.bonusAmount) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-700">Tổng thưởng dự kiến:</span>
                                    <span className="text-xl font-bold text-green-600">
                                        {formatCurrency(bonusPreviews.reduce((sum, p) => sum + p.bonusAmount, 0))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
